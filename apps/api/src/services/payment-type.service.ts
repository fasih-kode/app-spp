import {
  PaymentTypeRepository,
} from '../repositories/payment-type.repository.ts'
import type {
  CreatePaymentTypeData,
  PaymentType,
  UpdatePaymentTypeData,
} from '../repositories/payment-type.repository.ts'

export class PaymentTypeServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'PaymentTypeServiceError'
  }
}

export class PaymentTypeService {
  constructor(
    private readonly repository: PaymentTypeRepository,
  ) {}

  async getById(id: string): Promise<PaymentType> {
    const paymentType = await this.repository.findById(id)

    if (!paymentType) {
      throw new PaymentTypeServiceError(
        'PAYMENT_TYPE_NOT_FOUND',
        'Payment type not found',
      )
    }

    return paymentType
  }

  async getByCode(code: string): Promise<PaymentType> {
    const normalizedCode = this.normalizeCode(code)

    const paymentType =
      await this.repository.findByCode(normalizedCode)

    if (!paymentType) {
      throw new PaymentTypeServiceError(
        'PAYMENT_TYPE_NOT_FOUND',
        'Payment type not found',
      )
    }

    return paymentType
  }

  async create(
    data: CreatePaymentTypeData,
  ): Promise<PaymentType> {
    const normalizedCode = this.normalizeCode(data.code)
    const normalizedName = this.normalizeRequiredText(
      data.name,
      'PAYMENT_TYPE_INVALID_NAME',
      'Payment type name is required',
    )
    const normalizedNature = this.normalizeRequiredText(
      data.nature,
      'PAYMENT_TYPE_INVALID_NATURE',
      'Payment type nature is required',
    )

    const existing = await this.repository.findByCode(
      normalizedCode,
    )

    if (existing) {
      throw new PaymentTypeServiceError(
        'PAYMENT_TYPE_CODE_ALREADY_EXISTS',
        'Payment type code already exists',
      )
    }

    try {
      return await this.repository.create({
        code: normalizedCode,
        name: normalizedName,
        nature: normalizedNature,
        isActive: data.isActive ?? true,
        notes: data.notes ?? null,
      })
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new PaymentTypeServiceError(
          'PAYMENT_TYPE_CODE_ALREADY_EXISTS',
          'Payment type code already exists',
        )
      }

      throw error
    }
  }

  async update(
    id: string,
    data: UpdatePaymentTypeData,
  ): Promise<PaymentType> {
    await this.getById(id)

    const updateData: UpdatePaymentTypeData = {}

    if (data.code !== undefined) {
      updateData.code = this.normalizeCode(data.code)

      const existing = await this.repository.findByCode(
        updateData.code,
      )

      if (existing && existing.id !== id) {
        throw new PaymentTypeServiceError(
          'PAYMENT_TYPE_CODE_ALREADY_EXISTS',
          'Payment type code already exists',
        )
      }
    }

    if (data.name !== undefined) {
      updateData.name = this.normalizeRequiredText(
        data.name,
        'PAYMENT_TYPE_INVALID_NAME',
        'Payment type name is required',
      )
    }

    if (data.nature !== undefined) {
      updateData.nature = this.normalizeRequiredText(
        data.nature,
        'PAYMENT_TYPE_INVALID_NATURE',
        'Payment type nature is required',
      )
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive
    }

    if (data.notes !== undefined) {
      updateData.notes =
        data.notes === null
          ? null
          : data.notes.trim()
    }

    try {
      const updated = await this.repository.update(
        id,
        updateData,
      )

      if (!updated) {
        throw new PaymentTypeServiceError(
          'PAYMENT_TYPE_NOT_FOUND',
          'Payment type not found',
        )
      }

      return updated
    } catch (error) {
      if (error instanceof PaymentTypeServiceError) {
        throw error
      }

      if (this.isUniqueViolation(error)) {
        throw new PaymentTypeServiceError(
          'PAYMENT_TYPE_CODE_ALREADY_EXISTS',
          'Payment type code already exists',
        )
      }

      throw error
    }
  }

  async activate(id: string): Promise<PaymentType> {
    await this.getById(id)

    const updated = await this.repository.setActive(
      id,
      true,
    )

    if (!updated) {
      throw new PaymentTypeServiceError(
        'PAYMENT_TYPE_NOT_FOUND',
        'Payment type not found',
      )
    }

    return updated
  }

  async deactivate(id: string): Promise<PaymentType> {
    await this.getById(id)

    const updated = await this.repository.setActive(
      id,
      false,
    )

    if (!updated) {
      throw new PaymentTypeServiceError(
        'PAYMENT_TYPE_NOT_FOUND',
        'Payment type not found',
      )
    }

    return updated
  }

  private normalizeCode(code: string): string {
    const normalized = code.trim().toUpperCase()

    if (!normalized) {
      throw new PaymentTypeServiceError(
        'PAYMENT_TYPE_INVALID_CODE',
        'Payment type code is required',
      )
    }

    return normalized
  }

  private normalizeRequiredText(
    value: string,
    code: string,
    message: string,
  ): string {
    const normalized = value.trim()

    if (!normalized) {
      throw new PaymentTypeServiceError(
        code,
        message,
      )
    }

    return normalized
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    )
  }
}
