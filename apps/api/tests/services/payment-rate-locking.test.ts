import { eq } from 'drizzle-orm'

import { db } from '../../src/db/index.ts'

import { academicYears } from '../../../../database/drizzle/schema/academic-years.ts'
import { classes } from '../../../../database/drizzle/schema/classes.ts'
import { students } from '../../../../database/drizzle/schema/students.ts'
import { studentClassHistories } from '../../../../database/drizzle/schema/student-class-histories.ts'
import { paymentTypes } from '../../../../database/drizzle/schema/payment-types.ts'
import { paymentRates } from '../../../../database/drizzle/schema/payment-rates.ts'
import { invoices } from '../../../../database/drizzle/schema/invoices.ts'

import {
  PaymentRateService,
  PaymentRateServiceError,
} from '../../src/services/payment-rate.service.ts'

import { InvoiceService } from '../../src/services/invoice.service.ts'

const paymentRateService =
  new PaymentRateService()

const invoiceService =
  new InvoiceService()

const suffix = Date.now()

let academicYearId: string | undefined
let classId: string | undefined
let studentId: string | undefined
let paymentTypeId: string | undefined
let paymentRateId: string | undefined
let invoiceId: string | undefined

async function expectServiceError(
  operation: Promise<unknown>,
  expectedCode: string,
  label: string,
): Promise<void> {
  try {
    await operation

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

try {
  const academicYearRows =
    await db
      .insert(academicYears)
      .values({
        code: `TEST-LOCK-AY-${suffix}`,
        name: `Test Lock Academic Year ${suffix}`,
        startDate: '2032-07-01',
        endDate: '2033-06-30',
        isActive: false,
      })
      .returning()

  const academicYear =
    academicYearRows[0]

  if (!academicYear) {
    throw new Error(
      'ACADEMIC_YEAR_CREATE_FAILED',
    )
  }

  academicYearId =
    academicYear.id

  const classRows =
    await db
      .insert(classes)
      .values({
        code: `TEST-LOCK-CLASS-${suffix}`,
        name: `Test Lock Class ${suffix}`,
        level: 7,
        isActive: true,
      })
      .returning()

  const testClass =
    classRows[0]

  if (!testClass) {
    throw new Error(
      'CLASS_CREATE_FAILED',
    )
  }

  classId =
    testClass.id

  const studentRows =
    await db
      .insert(students)
      .values({
        studentCode: `TEST-LOCK-STUDENT-${suffix}`,
        nis: null,
        nisn: null,
        fullName: 'Test Payment Rate Lock Student',
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

  if (!student) {
    throw new Error(
      'STUDENT_CREATE_FAILED',
    )
  }

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
        code: `TEST-LOCK-PT-${suffix}`,
        name: `Test Lock Payment Type ${suffix}`,
        nature: 'MONTHLY',
        isActive: true,
        notes: null,
      })
      .returning()

  const paymentType =
    paymentTypeRows[0]

  if (!paymentType) {
    throw new Error(
      'PAYMENT_TYPE_CREATE_FAILED',
    )
  }

  paymentTypeId =
    paymentType.id

  const paymentRateRows =
    await db
      .insert(paymentRates)
      .values({
        academicYearId: academicYear.id,
        paymentTypeId: paymentType.id,
        amount: '150000.00',
        isActive: true,
      })
      .returning()

  const paymentRate =
    paymentRateRows[0]

  if (!paymentRate) {
    throw new Error(
      'PAYMENT_RATE_CREATE_FAILED',
    )
  }

  paymentRateId =
    paymentRate.id

  console.log(
    'PASS: create locking test fixture',
  )

  const updatedBeforeInvoice =
    await paymentRateService.update(
      paymentRate.id,
      {
        amount: '175000.00',
      },
    )

  if (
    !updatedBeforeInvoice ||
    updatedBeforeInvoice.amount !== '175000.00'
  ) {
    throw new Error(
      'UPDATE_BEFORE_INVOICE_FAILED',
    )
  }

  console.log(
    'PASS: unused payment rate can be updated',
  )

  await paymentRateService.deactivate(
    paymentRate.id,
  )

  const inactive =
    await paymentRateService.getById(
      paymentRate.id,
    )

  if (inactive.isActive !== false) {
    throw new Error(
      'DEACTIVATE_BEFORE_INVOICE_FAILED',
    )
  }

  console.log(
    'PASS: unused payment rate can be deactivated',
  )

  await paymentRateService.activate(
    paymentRate.id,
  )

  const active =
    await paymentRateService.getById(
      paymentRate.id,
    )

  if (active.isActive !== true) {
    throw new Error(
      'ACTIVATE_BEFORE_INVOICE_FAILED',
    )
  }

  console.log(
    'PASS: unused payment rate can be activated',
  )

  const invoice =
    await invoiceService.create({
      studentId: student.id,
      paymentTypeId: paymentType.id,
      period: '2032-09-01',
    })

  invoiceId =
    invoice.id

  if (
    invoice.nominal !== '175000.00'
  ) {
    throw new Error(
      'INVOICE_NOMINAL_FAILED',
    )
  }

  console.log(
    'PASS: invoice created using payment rate',
  )

  await expectServiceError(
    paymentRateService.update(
      paymentRate.id,
      {
        amount: '200000.00',
      },
    ),
    'PAYMENT_RATE_LOCKED',
    'used payment rate update rejected',
  )

  const stillOriginal =
    await paymentRateService.getById(
      paymentRate.id,
    )

  if (
    stillOriginal.amount !== '175000.00'
  ) {
    throw new Error(
      'LOCKED_PAYMENT_RATE_CHANGED',
    )
  }

  console.log(
    'PASS: used payment rate remains immutable',
  )

  await paymentRateService.deactivate(
    paymentRate.id,
  )

  const retired =
    await paymentRateService.getById(
      paymentRate.id,
    )

  if (retired.isActive !== false) {
    throw new Error(
      'USED_PAYMENT_RATE_NOT_RETIRED',
    )
  }

  console.log(
    'PASS: used payment rate can be retired',
  )

  await db
    .update(invoices)
    .set({
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledReason: 'Test cancellation',
      updatedAt: new Date(),
    })
    .where(
      eq(
        invoices.id,
        invoice.id,
      ),
    )

  console.log(
    'PASS: invoice cancelled directly for historical lock test',
  )

  await expectServiceError(
    paymentRateService.update(
      paymentRate.id,
      {
        amount: '225000.00',
      },
    ),
    'PAYMENT_RATE_LOCKED',
    'payment rate remains locked after cancelled invoice',
  )

  const stillImmutable =
    await paymentRateService.getById(
      paymentRate.id,
    )

  if (
    stillImmutable.amount !== '175000.00'
  ) {
    throw new Error(
      'CANCELLED_INVOICE_ALLOWED_RATE_CHANGE',
    )
  }

  console.log(
    'PASS: payment rate remains immutable after cancelled invoice',
  )

  const stillRetired =
    await paymentRateService.getById(
      paymentRate.id,
    )

  if (stillRetired.isActive !== false) {
    throw new Error(
      'RETIRED_PAYMENT_RATE_REACTIVATED_UNEXPECTEDLY',
    )
  }

  console.log(
    'PASS: payment rate remains retired after cancelled invoice',
  )

  console.log('')
  console.log(
    'PAYMENT RATE LOCKING TEST: ALL EXPECTED CASES PASSED',
  )
} finally {
  if (invoiceId) {
    await db
      .delete(invoices)
      .where(
        eq(
          invoices.id,
          invoiceId,
        ),
      )
  }

  if (paymentRateId) {
    await db
      .delete(paymentRates)
      .where(
        eq(
          paymentRates.id,
          paymentRateId,
        ),
      )
  }

  if (studentId) {
    await db
      .delete(studentClassHistories)
      .where(
        eq(
          studentClassHistories.studentId,
          studentId,
        ),
      )

    await db
      .delete(students)
      .where(
        eq(
          students.id,
          studentId,
        ),
      )
  }

  if (paymentTypeId) {
    await db
      .delete(paymentTypes)
      .where(
        eq(
          paymentTypes.id,
          paymentTypeId,
        ),
      )
  }

  if (classId) {
    await db
      .delete(classes)
      .where(
        eq(
          classes.id,
          classId,
        ),
      )
  }

  if (academicYearId) {
    await db
      .delete(academicYears)
      .where(
        eq(
          academicYears.id,
          academicYearId,
        ),
      )
  }

  console.log(
    'DATABASE CLEANUP: OK',
  )
}
