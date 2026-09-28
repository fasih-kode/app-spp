import { t } from 'elysia'

import {
  DateSchema,
  InvoiceSchema,
  UuidSchema,
} from './invoice.schema.ts'

export const MonthlyBillingItemStatusSchema =
  t.Union([
    t.Literal('CREATED'),
    t.Literal('SKIPPED'),
    t.Literal('FAILED'),
  ])

export const CreateMonthlyBillingSchema =
  t.Object({
    period: DateSchema,
  })

export const MonthlyBillingItemSchema =
  t.Object({
    studentId: UuidSchema,

    paymentTypeId: UuidSchema,

    status:
      MonthlyBillingItemStatusSchema,

    invoice: t.Optional(
      InvoiceSchema,
    ),

    errorCode: t.Optional(
      t.String({
        minLength: 1,
      }),
    ),

    message: t.Optional(
      t.String({
        minLength: 1,
      }),
    ),
  })

export const MonthlyBillingSchema =
  t.Object({
    period: DateSchema,

    academicYearId: UuidSchema,

    studentsScanned: t.Integer({
      minimum: 0,
    }),

    paymentTypesScanned: t.Integer({
      minimum: 0,
    }),

    generated: t.Integer({
      minimum: 0,
    }),

    skipped: t.Integer({
      minimum: 0,
    }),

    failed: t.Integer({
      minimum: 0,
    }),

    items: t.Array(
      MonthlyBillingItemSchema,
    ),
  })

export const MonthlyBillingResponseSchema =
  t.Object({
    data: MonthlyBillingSchema,
  })
