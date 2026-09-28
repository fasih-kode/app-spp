import type { Static } from 'elysia'

import type {
  MonthlyBillingResult,
} from '../services/monthly-billing.service.ts'

import {
  CreateMonthlyBillingSchema,
  MonthlyBillingItemSchema,
  MonthlyBillingSchema,
} from '../schemas/monthly-billing.schema.ts'

import {
  toInvoiceDto,
} from './invoice.dto.ts'

export type CreateMonthlyBillingDto =
  Static<
    typeof CreateMonthlyBillingSchema
  >

export type MonthlyBillingItemDto =
  Static<
    typeof MonthlyBillingItemSchema
  >

export type MonthlyBillingDto =
  Static<
    typeof MonthlyBillingSchema
  >

export type MonthlyBillingResponseDto = {
  data: MonthlyBillingDto
}

export function toMonthlyBillingDto(
  result: MonthlyBillingResult,
): MonthlyBillingDto {
  return {
    period: result.period,

    academicYearId:
      result.academicYearId,

    studentsScanned:
      result.studentsScanned,

    paymentTypesScanned:
      result.paymentTypesScanned,

    generated:
      result.generated,

    skipped:
      result.skipped,

    failed:
      result.failed,

    items: result.items.map(
      (item) => ({
        studentId:
          item.studentId,

        paymentTypeId:
          item.paymentTypeId,

        status:
          item.status,

        ...(item.invoice
          ? {
              invoice:
                toInvoiceDto(
                  item.invoice,
                ),
            }
          : {}),

        ...(item.errorCode
          ? {
              errorCode:
                item.errorCode,
            }
          : {}),

        ...(item.message
          ? {
              message:
                item.message,
            }
          : {}),
      }),
    ),
  }
}
