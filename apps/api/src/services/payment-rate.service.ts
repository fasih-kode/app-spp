import {
  PaymentRateRepository,
  type CreatePaymentRateData,
  type PaymentRateListParams,
  type PaymentRateListResult,
  type UpdatePaymentRateData,
} from '../repositories/payment-rate.repository.ts'

import { AcademicYearRepository } from '../repositories/academic-year.repository.ts'
import { InvoiceRepository } from '../repositories/invoice.repository.ts'
import { PaymentTypeRepository } from '../repositories/payment-type.repository.ts'

export class PaymentRateServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'PaymentRateServiceError'
  }
}

export class PaymentRateService {
  constructor(
    private readonly paymentRateRepository =
      new PaymentRateRepository(),
    private readonly academicYearRepository =
      new AcademicYearRepository(),
    private readonly paymentTypeRepository =
      new PaymentTypeRepository(),
    private readonly invoiceRepository =
      new InvoiceRepository(),
  ) {}

  async getById(id: string) {
    const paymentRate =
      await this.paymentRateRepository.findById(id)

    if (!paymentRate) {
      throw new PaymentRateServiceError(
        'PAYMENT_RATE_NOT_FOUND',
        'Payment rate not found',
      )
    }

    return paymentRate
  }

  async getByAcademicYearAndPaymentType(
    academicYearId: string,
    paymentTypeId: string,
  ) {
    return this.paymentRateRepository
      .findByAcademicYearAndPaymentType(
        academicYearId,
        paymentTypeId,
        true,
      )
  }

  async list(
    params: PaymentRateListParams = {},
  ): Promise<PaymentRateListResult> {
    return this.paymentRateRepository.list(params)
  }

  async create(
    data: CreatePaymentRateData,
  ) {
    this.validateAmount(data.amount)

    await this.ensureAcademicYearExists(
      data.academicYearId,
    )

    await this.ensurePaymentTypeExists(
      data.paymentTypeId,
    )

    if (data.isActive !== false) {
      const existing =
        await this.paymentRateRepository
          .findByAcademicYearAndPaymentType(
            data.academicYearId,
            data.paymentTypeId,
            true,
          )

      if (existing) {
        throw new PaymentRateServiceError(
          'PAYMENT_RATE_ALREADY_EXISTS',
          'Active payment rate already exists for this academic year and payment type',
        )
      }
    }

    try {
      return await this.paymentRateRepository.create(
        data,
      )
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new PaymentRateServiceError(
          'PAYMENT_RATE_ALREADY_EXISTS',
          'Active payment rate already exists for this academic year and payment type',
        )
      }

      throw error
    }
  }

  async update(
    id: string,
    data: UpdatePaymentRateData,
  ) {
    const existing = await this.getById(id)

    await this.ensureNotLocked(
      existing.academicYearId,
      existing.paymentTypeId,
    )

    if (data.amount !== undefined) {
      this.validateAmount(data.amount)
    }

    const academicYearId =
      data.academicYearId ??
      existing.academicYearId

    const paymentTypeId =
      data.paymentTypeId ??
      existing.paymentTypeId

    if (data.academicYearId !== undefined) {
      await this.ensureAcademicYearExists(
        data.academicYearId,
      )
    }

    if (data.paymentTypeId !== undefined) {
      await this.ensurePaymentTypeExists(
        data.paymentTypeId,
      )
    }

    const resultingIsActive =
      data.isActive ??
      existing.isActive

    if (resultingIsActive) {
      const duplicate =
        await this.paymentRateRepository
          .findByAcademicYearAndPaymentType(
            academicYearId,
            paymentTypeId,
            true,
          )

      if (
        duplicate &&
        duplicate.id !== existing.id
      ) {
        throw new PaymentRateServiceError(
          'PAYMENT_RATE_ALREADY_EXISTS',
          'Active payment rate already exists for this academic year and payment type',
        )
      }
    }

    try {
      const updated =
        await this.paymentRateRepository.update(
          id,
          data,
        )

      if (!updated) {
        throw new PaymentRateServiceError(
          'PAYMENT_RATE_NOT_FOUND',
          'Payment rate not found',
        )
      }

      return updated
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new PaymentRateServiceError(
          'PAYMENT_RATE_ALREADY_EXISTS',
          'Active payment rate already exists for this academic year and payment type',
        )
      }

      throw error
    }
  }

  async activate(id: string) {
    const existing = await this.getById(id)

    if (existing.isActive) {
      return existing
    }

    const duplicate =
      await this.paymentRateRepository
        .findByAcademicYearAndPaymentType(
          existing.academicYearId,
          existing.paymentTypeId,
          true,
        )

    if (
      duplicate &&
      duplicate.id !== existing.id
    ) {
      throw new PaymentRateServiceError(
        'PAYMENT_RATE_ALREADY_EXISTS',
        'Active payment rate already exists for this academic year and payment type',
      )
    }

    try {
      const activated =
        await this.paymentRateRepository.setActive(
          id,
          true,
        )

      if (!activated) {
        throw new PaymentRateServiceError(
          'PAYMENT_RATE_NOT_FOUND',
          'Payment rate not found',
        )
      }

      return activated
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new PaymentRateServiceError(
          'PAYMENT_RATE_ALREADY_EXISTS',
          'Active payment rate already exists for this academic year and payment type',
        )
      }

      throw error
    }
  }

  async deactivate(id: string) {
    const existing = await this.getById(id)

    if (!existing.isActive) {
      return existing
    }

    const deactivated =
      await this.paymentRateRepository.setActive(
        id,
        false,
      )

    if (!deactivated) {
      throw new PaymentRateServiceError(
        'PAYMENT_RATE_NOT_FOUND',
        'Payment rate not found',
      )
    }

    return deactivated
  }

  private async ensureNotLocked(
    academicYearId: string,
    paymentTypeId: string,
  ): Promise<void> {
    const hasInvoices =
      await this.invoiceRepository
        .hasInvoicesByAcademicYearAndPaymentType(
          academicYearId,
          paymentTypeId,
        )

    if (hasInvoices) {
      throw new PaymentRateServiceError(
        'PAYMENT_RATE_LOCKED',
        'Payment rate has already been used by an invoice and cannot be changed',
      )
    }
  }

  private validateAmount(amount: string): void {
    const normalized = amount.trim()

    if (!normalized) {
      throw new PaymentRateServiceError(
        'INVALID_PAYMENT_RATE_AMOUNT',
        'Payment rate amount is required',
      )
    }

    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
      throw new PaymentRateServiceError(
        'INVALID_PAYMENT_RATE_AMOUNT',
        'Payment rate amount must be a positive monetary value with up to two decimal places',
      )
    }

    if (Number(normalized) <= 0) {
      throw new PaymentRateServiceError(
        'INVALID_PAYMENT_RATE_AMOUNT',
        'Payment rate amount must be greater than zero',
      )
    }
  }

  private async ensureAcademicYearExists(
    id: string,
  ): Promise<void> {
    const academicYear =
      await this.academicYearRepository.findById(id)

    if (!academicYear) {
      throw new PaymentRateServiceError(
        'ACADEMIC_YEAR_NOT_FOUND',
        'Academic year not found',
      )
    }
  }

  private async ensurePaymentTypeExists(
    id: string,
  ): Promise<void> {
    const paymentType =
      await this.paymentTypeRepository.findById(id)

    if (!paymentType) {
      throw new PaymentRateServiceError(
        'PAYMENT_TYPE_NOT_FOUND',
        'Payment type not found',
      )
    }
  }
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
