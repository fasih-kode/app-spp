import { db } from '../../src/db/index.ts'

import {
  PaymentRateService,
  PaymentRateServiceError,
} from '../../src/services/payment-rate.service.ts'

import {
  InvoiceService,
} from '../../src/services/invoice.service.ts'

import {
  PaymentRateRepository,
} from '../../src/repositories/payment-rate.repository.ts'

import {
  PaymentTypeRepository,
} from '../../src/repositories/payment-type.repository.ts'

import {
  AcademicYearRepository,
} from '../../src/repositories/academic-year.repository.ts'

import {
  StudentRepository,
} from '../../src/repositories/student.repository.ts'

import {
  StudentClassHistoryRepository,
} from '../../src/repositories/student-class-history.repository.ts'

import {
  InvoiceRepository,
} from '../../src/repositories/invoice.repository.ts'

import {
  academicYears,
} from '../../../../database/drizzle/schema/academic-years.ts'

import {
  classes,
} from '../../../../database/drizzle/schema/classes.ts'

import {
  students,
} from '../../../../database/drizzle/schema/students.ts'

import {
  studentClassHistories,
} from '../../../../database/drizzle/schema/student-class-histories.ts'

import {
  paymentTypes,
} from '../../../../database/drizzle/schema/payment-types.ts'

import {
  paymentRates,
} from '../../../../database/drizzle/schema/payment-rates.ts'

import {
  invoices,
} from '../../../../database/drizzle/schema/invoices.ts'

import { eq } from 'drizzle-orm'

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(
      `ASSERTION_FAILED: ${message}`,
    )
  }
}

async function expectPaymentRateError(
  operation: () => Promise<unknown>,
  expectedCode: string,
  label: string,
): Promise<void> {
  try {
    await operation()

    throw new Error(
      `ASSERTION_FAILED: ${label}: expected ${expectedCode}, but operation succeeded`,
    )
  } catch (error) {
    if (
      error instanceof PaymentRateServiceError &&
      error.code === expectedCode
    ) {
      console.log(`PASS: ${label}`)
      return
    }

    throw error
  }
}

const paymentRateRepository =
  new PaymentRateRepository()

const paymentTypeRepository =
  new PaymentTypeRepository()

const academicYearRepository =
  new AcademicYearRepository()

const studentRepository =
  new StudentRepository()

const classHistoryRepository =
  new StudentClassHistoryRepository()

const invoiceRepository =
  new InvoiceRepository()

const paymentRateService =
  new PaymentRateService(
    paymentRateRepository,
    academicYearRepository,
    paymentTypeRepository,
  )

const invoiceService =
  new InvoiceService(
    invoiceRepository,
    academicYearRepository,
    studentRepository,
    classHistoryRepository,
    paymentTypeRepository,
    paymentRateRepository,
  )

const suffix = Date.now()

let academicYearId: string | null = null
let classId: string | null = null
let studentId: string | null = null
let paymentTypeId: string | null = null
let rateAId: string | null = null
let rateBId: string | null = null

try {
  const academicYearRows =
    await db
      .insert(academicYears)
      .values({
        code: `TEST-RATE-REPLACE-${suffix}`,
        name: `Test Rate Replacement ${suffix}`,
        startDate: '2032-07-01',
        endDate: '2033-06-30',
        isActive: false,
      })
      .returning()

  const academicYear =
    academicYearRows[0]

  assert(
    !!academicYear,
    'academic year created',
  )

  academicYearId =
    academicYear.id

  const classRows =
    await db
      .insert(classes)
      .values({
        code: `TEST-RATE-REPLACE-${suffix}`,
        name: `Test Rate Replacement Class ${suffix}`,
        level: 7,
        isActive: true,
      })
      .returning()

  const testClass =
    classRows[0]

  assert(
    !!testClass,
    'class created',
  )

  classId =
    testClass.id

  const studentRows =
    await db
      .insert(students)
      .values({
        studentCode: `TEST-RATE-REPLACE-${suffix}`,
        nis: null,
        nisn: null,
        fullName: 'Test Rate Replacement Student',
        gender: null,
        birthPlace: null,
        birthDate: null,
        guardianName: null,
        guardianPhone: null,
        entryDate: '2032-07-01',
        status: 'ACTIVE',
        exitDate: null,
        notes: null,
      })
      .returning()

  const student =
    studentRows[0]

  assert(
    !!student,
    'student created',
  )

  studentId =
    student.id

  await db
    .insert(studentClassHistories)
    .values({
      studentId: student.id,
      academicYearId: academicYear.id,
      classId: testClass.id,
      startDate: '2032-07-01',
      endDate: null,
    })

  const paymentTypeRows =
    await db
      .insert(paymentTypes)
      .values({
        code: `SPP-REPLACE-${suffix}`,
        name: `SPP Replacement ${suffix}`,
        nature: 'SPP',
        isActive: true,
        notes: null,
      })
      .returning()

  const paymentType =
    paymentTypeRows[0]

  assert(
    !!paymentType,
    'payment type created',
  )

  paymentTypeId =
    paymentType.id

  const rateARows =
    await db
      .insert(paymentRates)
      .values({
        academicYearId: academicYear.id,
        paymentTypeId: paymentType.id,
        amount: '150000.00',
        isActive: true,
      })
      .returning()

  const rateA =
    rateARows[0]

  assert(
    !!rateA,
    'rate A created',
  )

  rateAId =
    rateA.id

  console.log(
    'PASS: rate A created and active',
  )

  const invoiceA =
    await invoiceService.create({
      studentId: student.id,
      paymentTypeId: paymentType.id,
      period: '2032-09-01',
    })

  assert(
    invoiceA.nominal === '150000.00',
    'invoice A uses rate A',
  )

  console.log(
    'PASS: invoice A created using rate A',
  )

  await expectPaymentRateError(
    () =>
      paymentRateService.update(
        rateA.id,
        {
          amount: '175000.00',
        },
      ),
    'PAYMENT_RATE_LOCKED',
    'used rate A cannot be updated',
  )

  console.log(
    'PASS: rate A amount remains immutable',
  )

  const rateADeactivated =
    await paymentRateService.deactivate(
      rateA.id,
    )

  assert(
    rateADeactivated.isActive === false,
    'rate A can be deactivated',
  )

  console.log(
    'PASS: used rate A can be retired',
  )

  const rateB =
    await paymentRateService.create({
      academicYearId: academicYear.id,
      paymentTypeId: paymentType.id,
      amount: '175000.00',
      isActive: true,
    })

  rateBId =
    rateB.id

  assert(
    rateB.isActive === true,
    'rate B is active',
  )

  assert(
    rateB.amount === '175000.00',
    'rate B has replacement amount',
  )

  assert(
    rateB.id !== rateA.id,
    'rate B is a new record',
  )

  console.log(
    'PASS: rate B created as replacement',
  )

  const activeRate =
    await paymentRateService
      .getByAcademicYearAndPaymentType(
        academicYear.id,
        paymentType.id,
      )

  assert(
    activeRate?.id === rateB.id,
    'rate B is the active rate',
  )

  console.log(
    'PASS: rate B is active replacement',
  )

  const invoiceB =
    await invoiceService.create({
      studentId: student.id,
      paymentTypeId: paymentType.id,
      period: '2032-10-01',
    })

  assert(
    invoiceB.nominal === '175000.00',
    'invoice B uses rate B',
  )

  console.log(
    'PASS: invoice B uses rate B',
  )

  await expectPaymentRateError(
    () =>
      paymentRateService.update(
        rateB.id,
        {
          amount: '200000.00',
        },
      ),
    'PAYMENT_RATE_LOCKED',
    'used rate B cannot be updated',
  )

  console.log(
    'PASS: rate B becomes locked after use',
  )

  console.log(
    'PAYMENT RATE REPLACEMENT LIFECYCLE TEST: COMPLETED',
  )
} finally {
  await db.transaction(
    async (tx) => {
      if (studentId) {
        await tx
          .delete(invoices)
          .where(eq(invoices.studentId, studentId))

        await tx
          .delete(studentClassHistories)
          .where(
            eq(
              studentClassHistories.studentId,
              studentId,
            ),
          )

        await tx
          .delete(students)
          .where(eq(students.id, studentId))
      }

      if (rateAId) {
        await tx
          .delete(paymentRates)
          .where(eq(paymentRates.id, rateAId))
      }

      if (rateBId) {
        await tx
          .delete(paymentRates)
          .where(eq(paymentRates.id, rateBId))
      }

      if (paymentTypeId) {
        await tx
          .delete(paymentTypes)
          .where(eq(paymentTypes.id, paymentTypeId))
      }

      if (classId) {
        await tx
          .delete(classes)
          .where(eq(classes.id, classId))
      }

      if (academicYearId) {
        await tx
          .delete(academicYears)
          .where(eq(academicYears.id, academicYearId))
      }
    },
  )

  console.log(
    'DATABASE CLEANUP: OK',
  )
}
