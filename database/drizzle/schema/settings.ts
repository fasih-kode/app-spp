import {
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),

  schoolName: text('school_name').notNull(),
  schoolAddress: text('school_address'),
  schoolPhone: text('school_phone'),
  schoolEmail: text('school_email'),

  headmasterName: text('headmaster_name'),
  treasurerName: text('treasurer_name'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
