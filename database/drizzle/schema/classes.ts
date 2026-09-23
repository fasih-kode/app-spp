import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const classes = pgTable(
  'classes',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    code: text('code').notNull(),
    name: text('name').notNull(),

    level: integer('level').notNull(),

    isActive: boolean('is_active')
      .notNull()
      .default(true),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    codeUnique: uniqueIndex('classes_code_unique')
      .on(table.code),

    levelIndex: index('classes_level_idx')
      .on(table.level),

    validLevel: check(
      'classes_valid_level',
      sql`${table.level} >= 1 AND ${table.level} <= 12`,
    ),
  }),
)
