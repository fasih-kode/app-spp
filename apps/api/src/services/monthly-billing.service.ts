import {
  InvoiceRepository,
  type Invoice,
} from '../repositories/invoice.repository.ts'

import {
  AcademicYearRepository,
} from '../repositories/academic-year.repository.ts'

import {
  PaymentRateRepository,
} from '../repositories/payment-rate.repository.ts'

import {
  PaymentTypeRepository,
  type PaymentType,
} from '../repositories/payment-type.repository.ts'

import {
  StudentRepository,
} from '../repositories/student.repository.ts'

import {
  StudentClassHistoryRepository,
} from '../repositories/student-class-history.repository.ts'

export type MonthlyBillingItemStatus =
  | 'CREATED'
  | 'SKIPPED'
  | 'FAILED'

export type MonthlyBillingItemResult = {
  studentId: string
  paymentTypeId: string
  status: MonthlyBillingItemStatus
  invoice?: Invoice
  errorCode?: string
  message?: string
}

export type MonthlyBillingResult = {
  period: string
  academicYearId: string
  studentsScanned: number
  paymentTypesScanned: number
  generated: number
  skipped: number
  failed: number
  items: MonthlyBillingItemResult[]
}

export class MonthlyBillingServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'MonthlyBillingServiceError'
  }
}

export class MonthlyBillingService {
  constructor(
    private readonly invoiceRepository =
      new InvoiceRepository(),
    private readonly academicYearRepository =
      new AcademicYearRepository(),
    private readonly studentRepository =
      new StudentRepository(),
    private readonly classHistoryRepository =
      new StudentClassHistoryRepository(),
    private readonly paymentTypeRepository =
      new PaymentTypeRepository(),
    private readonly paymentRateRepository =
      new PaymentRateRepository(),
  ) {}

  async generate(
    inputPeriod: string,
  ): Promise<MonthlyBillingResult> {
    const period = this.normalizePeriod(inputPeriod)

    const academicYear =
      await this.academicYearRepository.findByPeriod(
        period,
      )

    if (!academicYear) {
      throw new MonthlyBillingServiceError(
        'ACADEMIC_YEAR_NOT_FOUND_FOR_PERIOD',
        'No academic year covers the billing period',
      )
    }

    const students =
      await this.studentRepository
        .findBillingEligibleByPeriod(period)

    const paymentTypes =
      await this.findActiveMonthlyPaymentTypes()

    const items: MonthlyBillingItemResult[] = []

    for (const student of students) {
      const classHistory =
        await this.classHistoryRepository
          .findByStudentAndPeriod(
            student.id,
            period,
          )

      if (!classHistory) {
        for (const paymentType of paymentTypes) {
          items.push({
            studentId: student.id,
            paymentTypeId: paymentType.id,
            status: 'FAILED',
            errorCode: 'NO_ACTIVE_CLASS_HISTORY',
            message:
              'No active class history covers the billing period',
          })
        }

        continue
      }

      for (const paymentType of paymentTypes) {
        const existing =
          await this.invoiceRepository
            .findActiveByStudentYearTypePeriod(
              student.id,
              academicYear.id,
              paymentType.id,
              period,
            )

        if (existing) {
          items.push({
            studentId: student.id,
            paymentTypeId: paymentType.id,
            status: 'SKIPPED',
            invoice: existing,
          })

          continue
        }

        const paymentRate =
          await this.paymentRateRepository
            .findByAcademicYearAndPaymentType(
              academicYear.id,
              paymentType.id,
              true,
            )

        if (!paymentRate) {
          items.push({
            studentId: student.id,
            paymentTypeId: paymentType.id,
            status: 'FAILED',
            errorCode: 'RATE_NOT_FOUND',
            message:
              'Active payment rate not found for this academic year and payment type',
          })

          continue
        }

        let nominal: string

        try {
          nominal = this.normalizeMoney(
            paymentRate.amount,
          )
        } catch (error) {
          items.push({
            studentId: student.id,
            paymentTypeId: paymentType.id,
            status: 'FAILED',
            errorCode:
              error instanceof MonthlyBillingServiceError
                ? error.code
                : 'INVALID_INVOICE_NOMINAL',
            message:
              error instanceof Error
                ? error.message
                : 'Invoice nominal is invalid',
          })

          continue
        }

        const invoiceData = {
          invoiceCode:
            this.generateInvoiceCode(period),
          studentId: student.id,
          academicYearId: academicYear.id,
          classId: classHistory.classId,
          paymentTypeId: paymentType.id,
          period,
          dueDate:
            this.calculateDueDate(period),
          nominal,
          discount: '0.00',
          payable: nominal,
          status: 'UNPAID' as const,
          discountReason: null,
          notes: 'Monthly billing',
        }

        try {
          const invoice =
            await this.invoiceRepository.create(
              invoiceData,
            )

          items.push({
            studentId: student.id,
            paymentTypeId: paymentType.id,
            status: 'CREATED',
            invoice,
          })
        } catch (error) {
          if (isUniqueViolation(error)) {
            const existingAfterConflict =
              await this.invoiceRepository
                .findActiveByStudentYearTypePeriod(
                  student.id,
                  academicYear.id,
                  paymentType.id,
                  period,
                )

            if (existingAfterConflict) {
              items.push({
                studentId: student.id,
                paymentTypeId: paymentType.id,
                status: 'SKIPPED',
                invoice: existingAfterConflict,
              })
            } else {
              items.push({
                studentId: student.id,
                paymentTypeId: paymentType.id,
                status: 'FAILED',
                errorCode: 'INVOICE_CREATE_FAILED',
                message:
                  'Invoice creation failed because of a unique constraint conflict',
              })
            }

            continue
          }

          items.push({
            studentId: student.id,
            paymentTypeId: paymentType.id,
            status: 'FAILED',
            errorCode: 'INVOICE_CREATE_FAILED',
            message:
              error instanceof Error
                ? error.message
                : 'Invoice creation failed',
          })
        }
      }
    }

    const generated =
      items.filter(
        (item) => item.status === 'CREATED',
      ).length

    const skipped =
      items.filter(
        (item) => item.status === 'SKIPPED',
      ).length

    const failed =
      items.filter(
        (item) => item.status === 'FAILED',
      ).length

    return {
      period,
      academicYearId: academicYear.id,
      studentsScanned: students.length,
      paymentTypesScanned: paymentTypes.length,
      generated,
      skipped,
      failed,
      items,
    }
  }

  private async findActiveMonthlyPaymentTypes(): Promise<
    PaymentType[]
  > {
    const paymentTypes: PaymentType[] = []

    let page = 1
    const perPage = 100

    while (true) {
      const result =
        await this.paymentTypeRepository.list({
          isActive: true,
          page,
          perPage,
        })

      paymentTypes.push(
        ...result.items.filter(
          (paymentType) =>
            paymentType.nature === 'BULANAN',
        ),
      )

      if (
        result.items.length < perPage ||
        page * perPage >= result.total
      ) {
        break
      }

      page += 1
    }

    return paymentTypes
  }

  private normalizePeriod(
    period: string,
  ): string {
    const normalized = period.trim()

    if (
      !/^\d{4}-\d{2}-01$/.test(normalized)
    ) {
      throw new MonthlyBillingServiceError(
        'INVALID_BILLING_PERIOD',
        'Billing period must be the first day of a month in YYYY-MM-01 format',
      )
    }

    const month = Number(
      normalized.slice(5, 7),
    )

    if (month < 1 || month > 12) {
      throw new MonthlyBillingServiceError(
        'INVALID_BILLING_PERIOD',
        'Billing period contains an invalid month',
      )
    }

    return normalized
  }

  private calculateDueDate(
    period: string,
  ): string {
    return `${period.slice(0, 8)}10`
  }

  private generateInvoiceCode(
    period: string,
  ): string {
    const month =
      period.slice(0, 7).replace('-', '')

    return `INV-${month}-${randomCode(8)}`
  }

  private normalizeMoney(
    value: string,
  ): string {
    const normalized = value.trim()

    if (
      !/^\d+(\.\d{1,2})?$/.test(normalized)
    ) {
      throw new MonthlyBillingServiceError(
        'INVALID_INVOICE_NOMINAL',
        'Invoice nominal is invalid',
      )
    }

    const cents = toCents(normalized)

    if (cents <= 0n) {
      throw new MonthlyBillingServiceError(
        'INVALID_INVOICE_NOMINAL',
        'Invoice nominal must be greater than zero',
      )
    }

    return fromCents(cents)
  }
}

function toCents(
  value: string,
): bigint {
  const [whole, fraction = ''] =
    value.split('.')

  return (
    BigInt(whole) * 100n +
    BigInt(fraction.padEnd(2, '0'))
  )
}

function fromCents(
  cents: bigint,
): string {
  const whole = cents / 100n
  const fraction =
    (cents % 100n)
      .toString()
      .padStart(2, '0')

  return `${whole}.${fraction}`
}

function randomCode(
  length: number,
): string {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

  const bytes =
    new Uint8Array(length)

  crypto.getRandomValues(bytes)

  let result = ''

  for (const byte of bytes) {
    result +=
      alphabet[byte % alphabet.length]
  }

  return result
}

function isUniqueViolation(
  error: unknown,
): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  )
}
