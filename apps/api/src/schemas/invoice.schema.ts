import { t } from 'elysia'

export const InvoiceStatusSchema = t.Union([
  t.Literal('UNPAID'),
  t.Literal('PARTIAL'),
  t.Literal('PAID'),
  t.Literal('CANCELLED'),
])

/**
 * UUID v4/v1-style textual representation.
 *
 * Semantic existence is validated by the service/database.
 */
export const UuidSchema = t.String({
  pattern:
    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
})

/**
 * ISO calendar date shape: YYYY-MM-DD.
 *
 * Business-level date validity is handled by the service.
 */
export const DateSchema = t.String({
  pattern:
    '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
})

export const DateTimeSchema = t.String({
  pattern:
    '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])T([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d{1,9})?(?:Z|[+-]([01]\\d|2[0-3]):[0-5]\\d)$',
})

export const MoneySchema = t.String({
  pattern: '^\\d+(\\.\\d{1,2})?$',
})

export const CreateInvoiceSchema = t.Object({
  studentId: UuidSchema,

  paymentTypeId: UuidSchema,

  period: DateSchema,

  discount: t.Optional(
    MoneySchema,
  ),

  discountReason: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 500,
    }),
  ),

  notes: t.Optional(
    t.String({
      maxLength: 2000,
    }),
  ),
})

export const InvoiceIdParamsSchema = t.Object({
  id: UuidSchema,
})

export const InvoiceListQuerySchema = t.Object({
  studentId: t.Optional(
    UuidSchema,
  ),

  academicYearId: t.Optional(
    UuidSchema,
  ),

  classId: t.Optional(
    UuidSchema,
  ),

  paymentTypeId: t.Optional(
    UuidSchema,
  ),

  period: t.Optional(
    DateSchema,
  ),

  status: t.Optional(
    InvoiceStatusSchema,
  ),

  page: t.Optional(
    t.Integer({
      minimum: 1,
    }),
  ),

  perPage: t.Optional(
    t.Integer({
      minimum: 1,
      maximum: 100,
    }),
  ),

  sortBy: t.Optional(
    t.Union([
      t.Literal('period'),
      t.Literal('dueDate'),
      t.Literal('invoiceCode'),
      t.Literal('nominal'),
      t.Literal('payable'),
      t.Literal('status'),
      t.Literal('createdAt'),
    ]),
  ),

  sortDirection: t.Optional(
    t.Union([
      t.Literal('asc'),
      t.Literal('desc'),
    ]),
  ),
})

export const InvoiceSchema = t.Object({
  id: UuidSchema,

  invoiceCode: t.String({
    minLength: 1,
  }),

  studentId: UuidSchema,

  academicYearId: UuidSchema,

  classId: UuidSchema,

  paymentTypeId: UuidSchema,

  period: DateSchema,

  dueDate: DateSchema,

  nominal: MoneySchema,

  discount: MoneySchema,

  payable: MoneySchema,

  status: InvoiceStatusSchema,

  discountReason: t.Union([
    t.String(),
    t.Null(),
  ]),

  notes: t.Union([
    t.String(),
    t.Null(),
  ]),

  cancelledAt: t.Union([
    DateTimeSchema,
    t.Null(),
  ]),

  cancelledReason: t.Union([
    t.String(),
    t.Null(),
  ]),

  createdAt: DateTimeSchema,

  updatedAt: DateTimeSchema,
})

export const InvoiceResponseSchema = t.Object({
  data: InvoiceSchema,
})

export const InvoiceListResponseSchema = t.Object({
  data: t.Array(
    InvoiceSchema,
  ),

  meta: t.Object({
    page: t.Integer({
      minimum: 1,
    }),

    perPage: t.Integer({
      minimum: 1,
      maximum: 100,
    }),

    total: t.Integer({
      minimum: 0,
    }),

    totalPages: t.Integer({
      minimum: 0,
    }),
  }),
})
