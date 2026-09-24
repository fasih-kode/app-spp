import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const paymentTypes = pgTable(
  'payment_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    code: text('code').notNull(),

    name: text('name').notNull(),

    nature: text('nature').notNull(),

    isActive: boolean('is_active')
      .notNull()
      .default(true),

    notes: text('notes'),

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
    codeUnique: uniqueIndex(
      'payment_types_code_unique',
    ).on(table.code),
  }),
)
