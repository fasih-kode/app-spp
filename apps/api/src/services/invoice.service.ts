import {
  InvoiceRepository,
  type CreateInvoiceData,
  type Invoice,
  type InvoiceListParams,
  type InvoiceListResult,
} from '../repositories/invoice.repository.ts'

import {
  AcademicYearRepository,
} from '../repositories/academic-year.repository.ts'

import {
  PaymentRateRepository,
} from '../repositories/payment-rate.repository.ts'

import {
  PaymentTypeRepository,
} from '../repositories/payment-type.repository.ts'

import {
  StudentRepository,
} from '../repositories/student.repository.ts'

import {
  StudentClassHistoryRepository,
} from '../repositories/student-class-history.repository.ts'

import type { Student } from '../types/student.ts'

export type CreateInvoiceInput = {
  studentId: string
  paymentTypeId: string
  period: string
  discount?: string
  discountReason?: string | null
  notes?: string | null
}

export class InvoiceServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'InvoiceServiceError'
  }
}

export class InvoiceService {
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

  async getById(id: string): Promise<Invoice> {
    const invoice =
      await this.invoiceRepository.findById(id)

    if (!invoice) {
      throw new InvoiceServiceError(
        'INVOICE_NOT_FOUND',
        'Invoice not found',
      )
    }

    return invoice
  }

  async list(
    params: InvoiceListParams = {},
  ): Promise<InvoiceListResult> {
    return this.invoiceRepository.list(params)
  }

  async create(
    data: CreateInvoiceInput,
  ): Promise<Invoice> {
    const period = this.normalizePeriod(data.period)

    const student =
      await this.ensureActiveStudent(data.studentId)

    const academicYear =
      await this.academicYearRepository.findByPeriod(
        period,
      )

    if (!academicYear) {
      throw new InvoiceServiceError(
        'ACADEMIC_YEAR_NOT_FOUND_FOR_PERIOD',
        'No academic year covers the invoice period',
      )
    }

    const classHistory =
      await this.classHistoryRepository.findByStudentAndPeriod(
        student.id,
        period,
      )

    if (!classHistory) {
      throw new InvoiceServiceError(
        'NO_ACTIVE_CLASS_HISTORY',
        'No active class history covers the invoice period',
      )
    }

    const paymentType =
      await this.paymentTypeRepository.findById(
        data.paymentTypeId,
      )

    if (!paymentType) {
      throw new InvoiceServiceError(
        'PAYMENT_TYPE_NOT_FOUND',
        'Payment type not found',
      )
    }

    if (!paymentType.isActive) {
      throw new InvoiceServiceError(
        'PAYMENT_TYPE_INACTIVE',
        'Payment type is inactive',
      )
    }

    const paymentRate =
      await this.paymentRateRepository
        .findByAcademicYearAndPaymentType(
          academicYear.id,
          paymentType.id,
          true,
        )

    if (!paymentRate) {
      throw new InvoiceServiceError(
        'RATE_NOT_FOUND',
        'Active payment rate not found for this academic year and payment type',
      )
    }

    const nominal = this.normalizeMoney(
      paymentRate.amount,
      'INVALID_INVOICE_NOMINAL',
      'Invoice nominal is invalid',
    )

    const discount = this.normalizeMoney(
      data.discount ?? '0',
      'INVALID_DISCOUNT',
      'Invoice discount is invalid',
    )

    this.validateDiscount(
      nominal,
      discount,
      data.discountReason,
    )

    const payable = subtractMoney(
      nominal,
      discount,
    )

    const existing =
      await this.invoiceRepository
        .findActiveByStudentYearTypePeriod(
          student.id,
          academicYear.id,
          paymentType.id,
          period,
        )

    if (existing) {
      throw new InvoiceServiceError(
        'INVOICE_ALREADY_EXISTS',
        'An active invoice already exists for this student, academic year, payment type, and period',
      )
    }

    const invoiceCode =
      this.generateInvoiceCode(period)

    const invoiceData: CreateInvoiceData = {
      invoiceCode,
      studentId: student.id,
      academicYearId: academicYear.id,
      classId: classHistory.classId,
      paymentTypeId: paymentType.id,
      period,
      dueDate: this.calculateDueDate(period),
      nominal,
      discount,
      payable,
      status: 'UNPAID',
      discountReason:
        normalizeNullableText(data.discountReason),
      notes: normalizeNullableText(data.notes),
    }

    try {
      return await this.invoiceRepository.create(
        invoiceData,
      )
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new InvoiceServiceError(
          'INVOICE_ALREADY_EXISTS',
          'An active invoice already exists or the generated invoice code is already in use',
        )
      }

      throw error
    }
  }

  private async ensureActiveStudent(
    studentId: string,
  ): Promise<Student> {
    const student =
      await this.studentRepository.findById(
        studentId,
      )

    if (!student) {
      throw new InvoiceServiceError(
        'STUDENT_NOT_FOUND',
        'Student not found',
      )
    }

    if (student.status !== 'ACTIVE') {
      throw new InvoiceServiceError(
        'STUDENT_NOT_ACTIVE',
        'Only ACTIVE students can receive a new invoice',
      )
    }

    return student
  }

  private normalizePeriod(
    period: string,
  ): string {
    const normalized = period.trim()

    if (
      !/^\d{4}-\d{2}-01$/.test(normalized)
    ) {
      throw new InvoiceServiceError(
        'INVALID_INVOICE_PERIOD',
        'Invoice period must be the first day of a month in YYYY-MM-01 format',
      )
    }

    const month = Number(
      normalized.slice(5, 7),
    )

    if (month < 1 || month > 12) {
      throw new InvoiceServiceError(
        'INVALID_INVOICE_PERIOD',
        'Invoice period contains an invalid month',
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
    code: string,
    message: string,
  ): string {
    const normalized = value.trim()

    if (
      !/^\d+(\.\d{1,2})?$/.test(normalized)
    ) {
      throw new InvoiceServiceError(
        code,
        message,
      )
    }

    const cents = toCents(normalized)

    if (cents < 0n) {
      throw new InvoiceServiceError(
        code,
        message,
      )
    }

    return fromCents(cents)
  }

  private validateDiscount(
    nominal: string,
    discount: string,
    discountReason: string | null | undefined,
  ): void {
    const nominalCents = toCents(nominal)
    const discountCents = toCents(discount)

    if (discountCents > nominalCents) {
      throw new InvoiceServiceError(
        'INVALID_DISCOUNT',
        'Invoice discount cannot exceed the invoice nominal',
      )
    }

    if (
      discountCents > 0n &&
      !discountReason?.trim()
    ) {
      throw new InvoiceServiceError(
        'DISCOUNT_REASON_REQUIRED',
        'Discount reason is required when the discount is greater than zero',
      )
    }
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

function subtractMoney(
  left: string,
  right: string,
): string {
  const result =
    toCents(left) - toCents(right)

  if (result < 0n) {
    throw new InvoiceServiceError(
      'INVALID_DISCOUNT',
      'Discount cannot exceed the invoice nominal',
    )
  }

  return fromCents(result)
}

function normalizeNullableText(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = value.trim()

  return normalized || null
}

function randomCode(length: number): string {
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
