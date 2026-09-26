import { db } from '/home/fasih/Projects/e-pembayaran-spp/apps/api/src/db/index.ts'

import {
  InvoiceService,
  InvoiceServiceError,
} from '/home/fasih/Projects/e-pembayaran-spp/apps/api/src/services/invoice.service.ts'

import {
  InvoiceRepository,
} from '/home/fasih/Projects/e-pembayaran-spp/apps/api/src/repositories/invoice.repository.ts'

import {
  AcademicYearRepository,
} from '/home/fasih/Projects/e-pembayaran-spp/apps/api/src/repositories/academic-year.repository.ts'

import {
  PaymentRateRepository,
} from '/home/fasih/Projects/e-pembayaran-spp/apps/api/src/repositories/payment-rate.repository.ts'

import {
  PaymentTypeRepository,
} from '/home/fasih/Projects/e-pembayaran-spp/apps/api/src/repositories/payment-type.repository.ts'

import {
  StudentRepository,
} from '/home/fasih/Projects/e-pembayaran-spp/apps/api/src/repositories/student.repository.ts'

import {
  StudentClassHistoryRepository,
} from '/home/fasih/Projects/e-pembayaran-spp/apps/api/src/repositories/student-class-history.repository.ts'

import {
  academicYears,
} from '/home/fasih/Projects/e-pembayaran-spp/database/drizzle/schema/academic-years.ts'

import {
  classes,
} from '/home/fasih/Projects/e-pembayaran-spp/database/drizzle/schema/classes.ts'

import {
  students,
} from '/home/fasih/Projects/e-pembayaran-spp/database/drizzle/schema/students.ts'

import {
  studentClassHistories,
} from '/home/fasih/Projects/e-pembayaran-spp/database/drizzle/schema/student-class-histories.ts'

import {
  paymentTypes,
} from '/home/fasih/Projects/e-pembayaran-spp/database/drizzle/schema/payment-types.ts'

import {
  paymentRates,
} from '/home/fasih/Projects/e-pembayaran-spp/database/drizzle/schema/payment-rates.ts'

import {
  invoices,
} from '/home/fasih/Projects/e-pembayaran-spp/database/drizzle/schema/invoices.ts'

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

async function expectError(
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
      error instanceof InvoiceServiceError &&
      error.code === expectedCode
    ) {
      console.log(`PASS: ${label}`)
      return
    }

    throw error
  }
}

const invoiceRepository =
  new InvoiceRepository()

const academicYearRepository =
  new AcademicYearRepository()

const studentRepository =
  new StudentRepository()

const classHistoryRepository =
  new StudentClassHistoryRepository()

const paymentTypeRepository =
  new PaymentTypeRepository()

const paymentRateRepository =
  new PaymentRateRepository()

const service =
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
let transferredStudentId: string | null = null
let paymentTypeId: string | null = null
let inactivePaymentTypeId: string | null = null
let paymentRateId: string | null = null

try {
  const academicYearRows =
    await db
      .insert(academicYears)
      .values({
        code: `TEST-INVOICE-${suffix}`,
        name: `Test Invoice Academic Year ${suffix}`,
        startDate: '2026-07-01',
        endDate: '2027-06-30',
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
        code: `TEST-INVOICE-${suffix}`,
        name: `Test Invoice Class ${suffix}`,
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

  classId = testClass.id

  const studentRows =
    await db
      .insert(students)
      .values({
        studentCode: `TEST-INVOICE-${suffix}`,
        nis: null,
        nisn: null,
        fullName: 'Test Invoice Student',
        gender: null,
        birthPlace: null,
        birthDate: null,
        guardianName: null,
        guardianPhone: null,
        entryDate: '2026-07-01',
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

  studentId = student.id

  const transferredStudentRows =
    await db
      .insert(students)
      .values({
        studentCode: `TEST-INVOICE-TRANSFERRED-${suffix}`,
        nis: null,
        nisn: null,
        fullName: 'Test Transferred Student',
        gender: null,
        birthPlace: null,
        birthDate: null,
        guardianName: null,
        guardianPhone: null,
        entryDate: '2026-07-01',
        status: 'TRANSFERRED',
        exitDate: '2026-08-15',
        notes: null,
      })
      .returning()

  const transferredStudent =
    transferredStudentRows[0]

  assert(
    !!transferredStudent,
    'transferred student created',
  )

  transferredStudentId =
    transferredStudent.id

  await db
    .insert(studentClassHistories)
    .values({
      studentId: student.id,
      academicYearId: academicYear.id,
      classId: testClass.id,
      startDate: '2026-07-01',
      endDate: null,
    })

  const paymentTypeRows =
    await db
      .insert(paymentTypes)
      .values({
        code: `SPP-TEST-${suffix}`,
        name: `SPP Test ${suffix}`,
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

  const inactivePaymentTypeRows =
    await db
      .insert(paymentTypes)
      .values({
        code: `SPP-INACTIVE-${suffix}`,
        name: `SPP Inactive ${suffix}`,
        nature: 'SPP',
        isActive: false,
        notes: null,
      })
      .returning()

  const inactivePaymentType =
    inactivePaymentTypeRows[0]

  assert(
    !!inactivePaymentType,
    'inactive payment type created',
  )

  inactivePaymentTypeId =
    inactivePaymentType.id

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

  assert(
    !!paymentRate,
    'payment rate created',
  )

  paymentRateId =
    paymentRate.id

  const invoice =
    await service.create({
      studentId: student.id,
      paymentTypeId: paymentType.id,
      period: '2026-09-01',
    })

  assert(
    invoice.period === '2026-09-01',
    'invoice period',
  )

  assert(
    invoice.dueDate === '2026-09-10',
    'due date is the 10th of the month',
  )

  assert(
    /^INV-202609-[A-Z0-9]{8}$/.test(
      invoice.invoiceCode,
    ),
    'invoice code format',
  )

  assert(
    invoice.nominal === '150000.00',
    'nominal comes from payment rate',
  )

  assert(
    invoice.discount === '0.00',
    'default discount is zero',
  )

  assert(
    invoice.payable === '150000.00',
    'payable equals nominal without discount',
  )

  assert(
    invoice.status === 'UNPAID',
    'new invoice status is UNPAID',
  )

  console.log(
    'PASS: create invoice normal',
  )

  const discountedInvoice =
    await service.create({
      studentId: student.id,
      paymentTypeId: paymentType.id,
      period: '2026-10-01',
      discount: '25000',
      discountReason: 'Test discount',
    })

  assert(
    discountedInvoice.nominal ===
      '150000.00',
    'discount invoice nominal',
  )

  assert(
    discountedInvoice.discount ===
      '25000.00',
    'discount invoice discount',
  )

  assert(
    discountedInvoice.payable ===
      '125000.00',
    'discount invoice payable',
  )

  console.log(
    'PASS: discount calculation',
  )

  await expectError(
    () =>
      service.create({
        studentId: student.id,
        paymentTypeId: paymentType.id,
        period: '2026-11-01',
        discount: '25000',
      }),
    'DISCOUNT_REASON_REQUIRED',
    'discount without reason rejected',
  )

  await expectError(
    () =>
      service.create({
        studentId: student.id,
        paymentTypeId: paymentType.id,
        period: '2026-12-01',
        discount: '150001',
        discountReason: 'Invalid test',
      }),
    'INVALID_DISCOUNT',
    'discount greater than nominal rejected',
  )

  await expectError(
    () =>
      service.create({
        studentId: '00000000-0000-0000-0000-000000000000',
        paymentTypeId: paymentType.id,
        period: '2026-09-01',
      }),
    'STUDENT_NOT_FOUND',
    'student not found rejected',
  )

  await expectError(
    () =>
      service.create({
        studentId: transferredStudent.id,
        paymentTypeId: paymentType.id,
        period: '2026-09-01',
      }),
    'STUDENT_NOT_ACTIVE',
    'transferred student rejected',
  )

  await expectError(
    () =>
      service.create({
        studentId: student.id,
        paymentTypeId: inactivePaymentType.id,
        period: '2026-09-01',
      }),
    'PAYMENT_TYPE_INACTIVE',
    'inactive payment type rejected',
  )

  const noRatePaymentTypeRows =
    await db
      .insert(paymentTypes)
      .values({
        code: `SPP-NORATE-${suffix}`,
        name: `SPP No Rate ${suffix}`,
        nature: 'SPP',
        isActive: true,
        notes: null,
      })
      .returning()

  const noRatePaymentType =
    noRatePaymentTypeRows[0]

  assert(
    !!noRatePaymentType,
    'no-rate payment type created',
  )

  await expectError(
    () =>
      service.create({
        studentId: student.id,
        paymentTypeId:
          noRatePaymentType.id,
        period: '2026-09-01',
      }),
    'RATE_NOT_FOUND',
    'missing payment rate rejected',
  )

  const noHistoryStudentRows =
    await db
      .insert(students)
      .values({
        studentCode: `TEST-INVOICE-NOHISTORY-${suffix}`,
        nis: null,
        nisn: null,
        fullName: 'Test No History Student',
        gender: null,
        birthPlace: null,
        birthDate: null,
        guardianName: null,
        guardianPhone: null,
        entryDate: '2026-07-01',
        status: 'ACTIVE',
        exitDate: null,
        notes: null,
      })
      .returning()

  const noHistoryStudent =
    noHistoryStudentRows[0]

  assert(
    !!noHistoryStudent,
    'no-history student created',
  )

  await expectError(
    () =>
      service.create({
        studentId: noHistoryStudent.id,
        paymentTypeId: paymentType.id,
        period: '2026-09-01',
      }),
    'NO_ACTIVE_CLASS_HISTORY',
    'missing class history rejected',
  )

  await expectError(
    () =>
      service.create({
        studentId: student.id,
        paymentTypeId: paymentType.id,
        period: '2026-09-01',
      }),
    'INVOICE_ALREADY_EXISTS',
    'duplicate invoice rejected',
  )

  const missingAcademicYearStudentRows =
    await db
      .insert(students)
      .values({
        studentCode: `TEST-INVOICE-NOAY-${suffix}`,
        nis: null,
        nisn: null,
        fullName: 'Test No Academic Year Student',
        gender: null,
        birthPlace: null,
        birthDate: null,
        guardianName: null,
        guardianPhone: null,
        entryDate: '2025-01-01',
        status: 'ACTIVE',
        exitDate: null,
        notes: null,
      })
      .returning()

  const missingAcademicYearStudent =
    missingAcademicYearStudentRows[0]

  assert(
    !!missingAcademicYearStudent,
    'no-academic-year student created',
  )

  await expectError(
    () =>
      service.create({
        studentId:
          missingAcademicYearStudent.id,
        paymentTypeId: paymentType.id,
        period: '2025-01-01',
      }),
    'ACADEMIC_YEAR_NOT_FOUND_FOR_PERIOD',
    'academic year missing rejected',
  )

  const cancelledInvoice =
    await service.create({
      studentId: student.id,
      paymentTypeId: paymentType.id,
      period: '2027-01-01',
    })

  await db
    .update(invoices)
    .set({
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledReason: 'Test cancellation',
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, cancelledInvoice.id))

  const replacementInvoice =
    await service.create({
      studentId: student.id,
      paymentTypeId: paymentType.id,
      period: '2027-01-01',
    })

  assert(
    replacementInvoice.id !==
      cancelledInvoice.id,
    'cancelled invoice can be replaced',
  )

  assert(
    replacementInvoice.invoiceCode !==
      cancelledInvoice.invoiceCode,
    'replacement invoice gets a new code',
  )

  console.log(
    'PASS: cancelled invoice can be replaced',
  )

  console.log('')
  console.log(
    'INVOICE SERVICE TEST: ALL EXPECTED CASES PASSED',
  )
} finally {
  await db
    .delete(invoices)
    .where(
      eq(
        invoices.studentId,
        studentId ?? '',
      ),
    )

  if (studentId) {
    await db
      .delete(studentClassHistories)
      .where(
        eq(
          studentClassHistories.studentId,
          studentId,
        ),
      )
  }

  if (transferredStudentId) {
    await db
      .delete(students)
      .where(
        eq(
          students.id,
          transferredStudentId,
        ),
      )
  }

  await db
    .delete(students)
    .where(
      eq(
        students.studentCode,
        `TEST-INVOICE-NOHISTORY-${suffix}`,
      ),
    )

  await db
    .delete(students)
    .where(
      eq(
        students.studentCode,
        `TEST-INVOICE-NOAY-${suffix}`,
      ),
    )

  await db
    .delete(paymentRates)
    .where(
      eq(
        paymentRates.id,
        paymentRateId ?? '',
      ),
    )

  await db
    .delete(paymentTypes)
    .where(
      eq(
        paymentTypes.id,
        paymentTypeId ?? '',
      ),
    )

  await db
    .delete(paymentTypes)
    .where(
      eq(
        paymentTypes.id,
        inactivePaymentTypeId ?? '',
      ),
    )

  await db
    .delete(paymentTypes)
    .where(
      eq(
        paymentTypes.code,
        `SPP-NORATE-${suffix}`,
      ),
    )

  await db
    .delete(classes)
    .where(
      eq(
        classes.id,
        classId ?? '',
      ),
    )

  await db
    .delete(students)
    .where(
      eq(
        students.id,
        studentId ?? '',
      ),
    )

  await db
    .delete(academicYears)
    .where(
      eq(
        academicYears.id,
        academicYearId ?? '',
      ),
    )
}
