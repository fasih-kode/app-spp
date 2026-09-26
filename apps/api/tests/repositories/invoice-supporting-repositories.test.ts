import { inArray } from 'drizzle-orm'

import { db } from '../../src/db/index.ts'
import { academicYears } from '../../../../database/drizzle/schema/academic-years.ts'
import { classes } from '../../../../database/drizzle/schema/classes.ts'
import { students } from '../../../../database/drizzle/schema/students.ts'
import { studentClassHistories } from '../../../../database/drizzle/schema/student-class-histories.ts'

import {
  AcademicYearRepository,
} from '../../src/repositories/academic-year.repository.ts'

import {
  StudentClassHistoryRepository,
} from '../../src/repositories/student-class-history.repository.ts'

const academicYearRepository =
  new AcademicYearRepository()

const classHistoryRepository =
  new StudentClassHistoryRepository()

const suffix = Date.now()

const academicYearCode =
  `TEST-INVOICE-SUPPORT-${suffix}`

const studentCode =
  `TEST-INVOICE-SUPPORT-${suffix}`

const nis =
  `TEST-NIS-${suffix}`

const nisn =
  `TEST-NISN-${suffix}`

let academicYearId: string | undefined
let classId: string | undefined
let studentId: string | undefined
let classHistoryId: string | undefined

try {
  const academicYearRows = await db
    .insert(academicYears)
    .values({
      code: academicYearCode,
      name: 'Test Invoice Supporting Academic Year',
      startDate: '2035-07-01',
      endDate: '2036-06-30',
      isActive: false,
    })
    .returning()

  const academicYear = academicYearRows[0]

  if (!academicYear) {
    throw new Error(
      'ACADEMIC_YEAR_CREATE_FAILED',
    )
  }

  academicYearId = academicYear.id

  console.log('PASS: create academic year')

  const classRows = await db
    .insert(classes)
    .values({
      code: `TEST-INVOICE-CLASS-${suffix}`,
      name: 'Test Invoice Class',
      level: 7,
      isActive: true,
    })
    .returning()

  const testClass = classRows[0]

  if (!testClass) {
    throw new Error('CLASS_CREATE_FAILED')
  }

  classId = testClass.id

  console.log('PASS: create class')

  const studentRows = await db
    .insert(students)
    .values({
      studentCode,
      nis,
      nisn,
      fullName: 'Test Invoice Supporting Student',
      entryDate: '2035-07-01',
      status: 'ACTIVE',
      exitDate: null,
    })
    .returning()

  const student = studentRows[0]

  if (!student) {
    throw new Error('STUDENT_CREATE_FAILED')
  }

  studentId = student.id

  console.log('PASS: create student')

  const classHistoryRows = await db
    .insert(studentClassHistories)
    .values({
      studentId,
      academicYearId,
      classId,
      startDate: '2035-07-01',
      endDate: '2035-10-01',
    })
    .returning()

  const classHistory = classHistoryRows[0]

  if (!classHistory) {
    throw new Error(
      'CLASS_HISTORY_CREATE_FAILED',
    )
  }

  classHistoryId = classHistory.id

  console.log('PASS: create class history')

  const beforeStart =
    await academicYearRepository.findByPeriod(
      '2035-06-01',
    )

  if (beforeStart !== null) {
    throw new Error(
      'ACADEMIC_YEAR_BEFORE_START_FAILED',
    )
  }

  console.log(
    'PASS: academic year before start → not found',
  )

  const atStart =
    await academicYearRepository.findByPeriod(
      '2035-07-01',
    )

  if (
    !atStart ||
    atStart.id !== academicYearId
  ) {
    throw new Error(
      'ACADEMIC_YEAR_AT_START_FAILED',
    )
  }

  console.log(
    'PASS: academic year at start date',
  )

  const insidePeriod =
    await academicYearRepository.findByPeriod(
      '2035-09-01',
    )

  if (
    !insidePeriod ||
    insidePeriod.id !== academicYearId
  ) {
    throw new Error(
      'ACADEMIC_YEAR_INSIDE_PERIOD_FAILED',
    )
  }

  console.log(
    'PASS: academic year inside period',
  )

  const atEnd =
    await academicYearRepository.findByPeriod(
      '2036-06-01',
    )

  if (
    !atEnd ||
    atEnd.id !== academicYearId
  ) {
    throw new Error(
      'ACADEMIC_YEAR_AT_END_FAILED',
    )
  }

  console.log(
    'PASS: academic year at end period',
  )

  const afterEnd =
    await academicYearRepository.findByPeriod(
      '2036-07-01',
    )

  if (afterEnd !== null) {
    throw new Error(
      'ACADEMIC_YEAR_AFTER_END_FAILED',
    )
  }

  console.log(
    'PASS: academic year after end → not found',
  )

  const historyBefore =
    await classHistoryRepository
      .findByStudentAndPeriod(
        studentId,
        '2035-06-01',
      )

  if (historyBefore !== null) {
    throw new Error(
      'CLASS_HISTORY_BEFORE_START_FAILED',
    )
  }

  console.log(
    'PASS: class history before start → not found',
  )

  const historyAtStart =
    await classHistoryRepository
      .findByStudentAndPeriod(
        studentId,
        '2035-07-01',
      )

  if (
    !historyAtStart ||
    historyAtStart.id !== classHistoryId
  ) {
    throw new Error(
      'CLASS_HISTORY_AT_START_FAILED',
    )
  }

  console.log(
    'PASS: class history at start date',
  )

  const historyInside =
    await classHistoryRepository
      .findByStudentAndPeriod(
        studentId,
        '2035-09-01',
      )

  if (
    !historyInside ||
    historyInside.id !== classHistoryId
  ) {
    throw new Error(
      'CLASS_HISTORY_INSIDE_PERIOD_FAILED',
    )
  }

  console.log(
    'PASS: class history inside period',
  )

  const historyAtEnd =
    await classHistoryRepository
      .findByStudentAndPeriod(
        studentId,
        '2035-10-01',
      )

  if (historyAtEnd !== null) {
    throw new Error(
      'CLASS_HISTORY_AT_END_FAILED',
    )
  }

  console.log(
    'PASS: class history at end → not found',
  )

  const historyAfter =
    await classHistoryRepository
      .findByStudentAndPeriod(
        studentId,
        '2035-11-01',
      )

  if (historyAfter !== null) {
    throw new Error(
      'CLASS_HISTORY_AFTER_END_FAILED',
    )
  }

  console.log(
    'PASS: class history after end → not found',
  )

  console.log(
    'INVOICE SUPPORTING REPOSITORIES TEST: 14/14 PASS',
  )
} finally {
  if (classHistoryId) {
    await db
      .delete(studentClassHistories)
      .where(
        inArray(
          studentClassHistories.id,
          [classHistoryId],
        ),
      )
  }

  if (studentId) {
    await db
      .delete(students)
      .where(
        inArray(
          students.id,
          [studentId],
        ),
      )
  }

  if (classId) {
    await db
      .delete(classes)
      .where(
        inArray(
          classes.id,
          [classId],
        ),
      )
  }

  if (academicYearId) {
    await db
      .delete(academicYears)
      .where(
        inArray(
          academicYears.id,
          [academicYearId],
        ),
      )
  }

  console.log('DATABASE CLEANUP: OK')
}
