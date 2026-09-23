import {
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

export const students = pgTable(
  'students',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    studentCode: text('student_code').notNull(),

    nis: text('nis'),

    nisn: text('nisn'),

    fullName: text('full_name').notNull(),

    gender: text('gender'),

    birthPlace: text('birth_place'),

    birthDate: date('birth_date', {
      mode: 'string',
    }),

    guardianName: text('guardian_name'),

    guardianPhone: text('guardian_phone'),

    entryDate: date('entry_date', {
      mode: 'string',
    }).notNull(),

    status: text('status', {
      enum: ['ACTIVE', 'TRANSFERRED', 'GRADUATED'],
    })
      .notNull()
      .default('ACTIVE'),

    exitDate: date('exit_date', {
      mode: 'string',
    }),

    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    studentCodeUnique: uniqueIndex('students_student_code_unique')
      .on(table.studentCode),

    nisUnique: uniqueIndex('students_nis_unique')
      .on(table.nis),

    nisnUnique: uniqueIndex('students_nisn_unique')
      .on(table.nisn),

    statusIndex: index('students_status_idx')
      .on(table.status),

    entryDateIndex: index('students_entry_date_idx')
      .on(table.entryDate),

    validStatus: check(
      'students_valid_status',
      sql`${table.status} IN ('ACTIVE', 'TRANSFERRED', 'GRADUATED')`,
    ),

    validStatusExitDate: check(
      'students_valid_status_exit_date',
      sql`
        (
          ${table.status} = 'ACTIVE'
          AND ${table.exitDate} IS NULL
        )
        OR
        (
          ${table.status} IN ('TRANSFERRED', 'GRADUATED')
          AND ${table.exitDate} IS NOT NULL
        )
      `,
    ),

    validExitDate: check(
      'students_valid_exit_date',
      sql`
        ${table.exitDate} IS NULL
        OR ${table.exitDate} >= ${table.entryDate}
      `,
    ),
  }),
)
