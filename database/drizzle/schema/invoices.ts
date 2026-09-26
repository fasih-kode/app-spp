import {
  check,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import { academicYears } from './academic-years.ts'
import { classes } from './classes.ts'
import { paymentTypes } from './payment-types.ts'
import { students } from './students.ts'

export const invoiceStatus = pgEnum(
  'invoice_status',
  [
    'UNPAID',
    'PARTIAL',
    'PAID',
    'CANCELLED',
  ],
)

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    invoiceCode: text('invoice_code')
      .notNull(),

    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    academicYearId: uuid('academic_year_id')
      .notNull()
      .references(() => academicYears.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    paymentTypeId: uuid('payment_type_id')
      .notNull()
      .references(() => paymentTypes.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    period: date('period', {
      mode: 'string',
    }).notNull(),

    dueDate: date('due_date', {
      mode: 'string',
    }).notNull(),

    nominal: numeric('nominal', {
      precision: 14,
      scale: 2,
      mode: 'string',
    }).notNull(),

    discount: numeric('discount', {
      precision: 14,
      scale: 2,
      mode: 'string',
    })
      .notNull()
      .default('0'),

    payable: numeric('payable', {
      precision: 14,
      scale: 2,
      mode: 'string',
    }).notNull(),

    status: invoiceStatus('status')
      .notNull()
      .default('UNPAID'),

    discountReason: text('discount_reason'),

    notes: text('notes'),

    cancelledAt: timestamp('cancelled_at', {
      withTimezone: true,
    }),

    cancelledReason: text('cancelled_reason'),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    invoiceCodeUnique: uniqueIndex(
      'invoices_invoice_code_unique',
    ).on(table.invoiceCode),

    activeStudentYearTypePeriodUnique: uniqueIndex(
      'invoices_active_student_year_type_period_unique',
    )
      .on(
        table.studentId,
        table.academicYearId,
        table.paymentTypeId,
        table.period,
      )
      .where(
        sql`${table.status} <> 'CANCELLED'`,
      ),

    studentIndex: index(
      'invoices_student_idx',
    ).on(table.studentId),

    academicYearIndex: index(
      'invoices_academic_year_idx',
    ).on(table.academicYearId),

    paymentTypeIndex: index(
      'invoices_payment_type_idx',
    ).on(table.paymentTypeId),

    periodIndex: index(
      'invoices_period_idx',
    ).on(table.period),

    studentAcademicYearPeriodIndex: index(
      'invoices_student_year_period_idx',
    ).on(
      table.studentId,
      table.academicYearId,
      table.period,
    ),

    academicYearPaymentTypePeriodIndex: index(
      'invoices_year_payment_type_period_idx',
    ).on(
      table.academicYearId,
      table.paymentTypeId,
      table.period,
    ),

    periodFirstDayCheck: check(
      'invoices_period_first_day',
      sql`${table.period} = date_trunc('month', ${table.period})::date`,
    ),

    nominalPositive: check(
      'invoices_nominal_positive',
      sql`${table.nominal} > 0`,
    ),

    discountNonNegative: check(
      'invoices_discount_non_negative',
      sql`${table.discount} >= 0`,
    ),

    discountNotGreaterThanNominal: check(
      'invoices_discount_not_greater_than_nominal',
      sql`${table.discount} <= ${table.nominal}`,
    ),

    payableNonNegative: check(
      'invoices_payable_non_negative',
      sql`${table.payable} >= 0`,
    ),

    payableMatchesNominalAndDiscount: check(
      'invoices_payable_matches_nominal_discount',
      sql`${table.payable} = ${table.nominal} - ${table.discount}`,
    ),

    discountReasonRequired: check(
      'invoices_discount_reason_required',
      sql`
        ${table.discount} = 0
        OR NULLIF(BTRIM(${table.discountReason}), '') IS NOT NULL
      `,
    ),

    cancellationFieldsConsistent: check(
      'invoices_cancellation_fields_consistent',
      sql`
        (
          ${table.status} = 'CANCELLED'
          AND ${table.cancelledAt} IS NOT NULL
          AND NULLIF(BTRIM(${table.cancelledReason}), '') IS NOT NULL
        )
        OR
        (
          ${table.status} <> 'CANCELLED'
          AND ${table.cancelledAt} IS NULL
          AND ${table.cancelledReason} IS NULL
        )
      `,
    ),
  }),
)
