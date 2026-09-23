import {
  boolean,
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const academicYears = pgTable(
  'academic_years',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    code: text('code').notNull(),
    name: text('name').notNull(),

    startDate: date('start_date', {
      mode: 'string',
    }).notNull(),

    endDate: date('end_date', {
      mode: 'string',
    }).notNull(),

    isActive: boolean('is_active')
      .notNull()
      .default(false),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    codeUnique: uniqueIndex('academic_years_code_unique')
      .on(table.code),

    activeUnique: uniqueIndex('academic_years_one_active_unique')
      .on(table.isActive)
      .where(sql`${table.isActive} = true`),

    dateRangeIndex: index('academic_years_date_range_idx')
      .on(table.startDate, table.endDate),

    validDateRange: check(
      'academic_years_valid_date_range',
      sql`${table.endDate} > ${table.startDate}`,
    ),
  }),
)
