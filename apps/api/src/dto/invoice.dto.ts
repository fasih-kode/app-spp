import type { Static } from 'elysia'

import type {
  Invoice,
  InvoiceListResult,
} from '../repositories/invoice.repository.ts'

import type {
  CreateInvoiceSchema,
  InvoiceListQuerySchema,
  InvoiceSchema,
} from '../schemas/invoice.schema.ts'

export type CreateInvoiceDto = Static<
  typeof CreateInvoiceSchema
>

export type InvoiceListQueryDto = Static<
  typeof InvoiceListQuerySchema
>

export type InvoiceDto = Static<
  typeof InvoiceSchema
>

export type InvoiceListDto = {
  data: InvoiceDto[]
  meta: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

export function toInvoiceDto(
  invoice: Invoice,
): InvoiceDto {
  return {
    id: invoice.id,
    invoiceCode: invoice.invoiceCode,

    studentId: invoice.studentId,
    academicYearId: invoice.academicYearId,
    classId: invoice.classId,
    paymentTypeId: invoice.paymentTypeId,

    period: invoice.period,
    dueDate: invoice.dueDate,

    nominal: invoice.nominal,
    discount: invoice.discount,
    payable: invoice.payable,

    status: invoice.status,

    discountReason: invoice.discountReason,
    notes: invoice.notes,

    cancelledAt:
      invoice.cancelledAt?.toISOString() ?? null,

    cancelledReason: invoice.cancelledReason,

    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  }
}

export function toInvoiceListDto(
  result: InvoiceListResult,
  page: number,
  perPage: number,
): InvoiceListDto {
  return {
    data: result.data.map(toInvoiceDto),

    meta: {
      page,
      perPage,
      total: result.total,
      totalPages:
        result.total === 0
          ? 0
          : Math.ceil(result.total / perPage),
    },
  }
}
