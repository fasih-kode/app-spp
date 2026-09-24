import {
  boolean,
  check,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import { academicYears } from './academic-years.ts'
import { paymentTypes } from './payment-types.ts'

export const paymentRates = pgTable(
  'payment_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    academicYearId: uuid('academic_year_id')
      .notNull()
      .references(() => academicYears.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    paymentTypeId: uuid('payment_type_id')
      .notNull()
      .references(() => paymentTypes.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    amount: numeric('amount', {
      precision: 14,
      scale: 2,
      mode: 'string',
    }).notNull(),

    isActive: boolean('is_active')
      .notNull()
      .default(true),

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
    activeAcademicYearPaymentTypeUnique: uniqueIndex(
      'payment_rates_active_year_type_unique',
    )
      .on(
        table.academicYearId,
        table.paymentTypeId,
      )
      .where(sql`${table.isActive} = true`),

    amountPositive: check(
      'payment_rates_amount_positive',
      sql`${table.amount} > 0`,
    ),
  }),
)
