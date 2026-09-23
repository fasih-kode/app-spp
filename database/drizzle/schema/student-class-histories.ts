import {
  check,
  date,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { academicYears } from './academic-years.ts'
import { classes } from './classes.ts'
import { students } from './students.ts'

export const studentClassHistories = pgTable(
  'student_class_histories',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

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

    startDate: date('start_date', {
      mode: 'string',
    }).notNull(),

    endDate: date('end_date', {
      mode: 'string',
    }),

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
    studentIndex: index(
      'student_class_histories_student_idx',
    ).on(table.studentId),

    academicYearIndex: index(
      'student_class_histories_academic_year_idx',
    ).on(table.academicYearId),

    classIndex: index(
      'student_class_histories_class_idx',
    ).on(table.classId),

    activeStudentUnique: uniqueIndex(
      'student_class_histories_one_active_unique',
    )
      .on(table.studentId)
      .where(sql`${table.endDate} IS NULL`),

    validDateRange: check(
      'student_class_histories_valid_date_range',
      sql`
        ${table.endDate} IS NULL
        OR ${table.endDate} >= ${table.startDate}
      `,
    ),
  }),
)
