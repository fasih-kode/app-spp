import { inArray } from 'drizzle-orm'

import { db } from '../../src/db/index.ts'
import { students } from '../../../../database/drizzle/schema/students.ts'
import {
  StudentRepository,
} from '../../src/repositories/student.repository.ts'

const repository = new StudentRepository()

const suffix = Date.now()
const period = '2026-09-01'

const studentCodes = [
  `TEST-BILLING-ENTRY-EQUAL-${suffix}`,
  `TEST-BILLING-ENTRY-AFTER-${suffix}`,
  `TEST-BILLING-EXIT-EQUAL-${suffix}`,
  `TEST-BILLING-EXIT-AFTER-${suffix}`,
  `TEST-BILLING-EXIT-NULL-${suffix}`,
  `TEST-BILLING-HISTORICAL-${suffix}`,
]

let studentIds: string[] = []

try {
  const rows = await db
    .insert(students)
    .values([
      {
        studentCode: studentCodes[0],
        fullName: 'Test Billing Entry Equal',
        entryDate: '2026-09-01',
        status: 'ACTIVE',
        exitDate: null,
      },
      {
        studentCode: studentCodes[1],
        fullName: 'Test Billing Entry After',
        entryDate: '2026-10-01',
        status: 'ACTIVE',
        exitDate: null,
      },
      {
        studentCode: studentCodes[2],
        fullName: 'Test Billing Exit Equal',
        entryDate: '2026-07-01',
        status: 'TRANSFERRED',
        exitDate: '2026-09-01',
      },
      {
        studentCode: studentCodes[3],
        fullName: 'Test Billing Exit After',
        entryDate: '2026-07-01',
        status: 'TRANSFERRED',
        exitDate: '2026-10-01',
      },
      {
        studentCode: studentCodes[4],
        fullName: 'Test Billing Exit Null',
        entryDate: '2026-07-01',
        status: 'ACTIVE',
        exitDate: null,
      },
      {
        studentCode: studentCodes[5],
        fullName: 'Test Billing Historical',
        entryDate: '2026-07-01',
        status: 'GRADUATED',
        exitDate: '2026-10-01',
      },
    ])
    .returning()

  studentIds = rows.map((student) => student.id)

  if (rows.length !== 6) {
    throw new Error('STUDENT_FIXTURE_CREATE_FAILED')
  }

  console.log('PASS: create billing eligibility fixtures')

  const eligible =
    await repository.findBillingEligibleByPeriod(period)

  const eligibleCodes = new Set(
    eligible.map((student) => student.studentCode),
  )

  if (
    !eligibleCodes.has(studentCodes[0]) ||
    eligibleCodes.has(studentCodes[1]) ||
    eligibleCodes.has(studentCodes[2]) ||
    !eligibleCodes.has(studentCodes[3]) ||
    !eligibleCodes.has(studentCodes[4]) ||
    !eligibleCodes.has(studentCodes[5])
  ) {
    throw new Error('BILLING_ELIGIBILITY_BOUNDARY_FAILED')
  }

  console.log(
    'PASS: billing eligibility boundary rules',
  )

  const historicalStudent = eligible.find(
    (student) =>
      student.studentCode === studentCodes[5],
  )

  if (
    !historicalStudent ||
    historicalStudent.status !== 'GRADUATED'
  ) {
    throw new Error(
      'CURRENT_STATUS_MUST_NOT_DISQUALIFY_HISTORICAL_ELIGIBILITY',
    )
  }

  console.log(
    'PASS: current status does not disqualify historical eligibility',
  )

  if (
    eligible.some(
      (student) =>
        student.studentCode === studentCodes[1],
    )
  ) {
    throw new Error(
      'ENTRY_DATE_AFTER_PERIOD_MUST_NOT_BE_ELIGIBLE',
    )
  }

  console.log(
    'PASS: entryDate after period is excluded',
  )

  if (
    eligible.some(
      (student) =>
        student.studentCode === studentCodes[2],
    )
  ) {
    throw new Error(
      'EXIT_DATE_EQUAL_PERIOD_MUST_NOT_BE_ELIGIBLE',
    )
  }

  console.log(
    'PASS: exitDate equal period is excluded',
  )

  console.log(
    'STUDENT REPOSITORY BILLING ELIGIBILITY TEST: 5/5 PASS',
  )
} finally {
  if (studentIds.length > 0) {
    await db
      .delete(students)
      .where(
        inArray(
          students.id,
          studentIds,
        ),
      )
  }

  console.log('DATABASE CLEANUP: OK')
}
