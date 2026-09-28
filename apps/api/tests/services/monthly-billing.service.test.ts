import { and, eq, inArray, like, sql } from 'drizzle-orm'

import { db } from '../../src/db/index.ts'

import { academicYears } from '../../../../database/drizzle/schema/academic-years.ts'
import { classes } from '../../../../database/drizzle/schema/classes.ts'
import { students } from '../../../../database/drizzle/schema/students.ts'
import { studentClassHistories } from '../../../../database/drizzle/schema/student-class-histories.ts'
import { paymentTypes } from '../../../../database/drizzle/schema/payment-types.ts'
import { paymentRates } from '../../../../database/drizzle/schema/payment-rates.ts'
import { invoices } from '../../../../database/drizzle/schema/invoices.ts'

import {
  MonthlyBillingService,
} from '../../src/services/monthly-billing.service.ts'

import {
  InvoiceRepository,
} from '../../src/repositories/invoice.repository.ts'

const service = new MonthlyBillingService()

class FailingInvoiceRepository extends InvoiceRepository {
  constructor(
    private readonly failedStudentId: string,
  ) {
    super()
  }

  override async create(
    data: Parameters<
      InvoiceRepository['create']
    >[0],
  ): Promise<
    Awaited<
      ReturnType<InvoiceRepository['create']>
    >
  > {
    if (data.studentId === this.failedStudentId) {
      throw new Error(
        'SIMULATED_INVOICE_CREATE_FAILURE',
      )
    }

    return super.create(data)
  }
}

const suffix = Date.now()
const period = '2026-09-01'

const academicYearCode =
  `TEST-MONTHLY-BILLING-${suffix}`

const classCode =
  `TEST-MONTHLY-BILLING-${suffix}`

const monthlyPaymentTypeCode =
  `TEST-MONTHLY-${suffix}`

const oncePaymentTypeCode =
  `TEST-ONCE-${suffix}`

const noRatePaymentTypeCode =
  `TEST-NO-RATE-${suffix}`

const studentCodes = {
  active:
    `TEST-MB-ACTIVE-${suffix}`,
  exitLater:
    `TEST-MB-EXIT-LATER-${suffix}`,
  exitEqual:
    `TEST-MB-EXIT-EQUAL-${suffix}`,
  entryLater:
    `TEST-MB-ENTRY-LATER-${suffix}`,
  graduated:
    `TEST-MB-GRADUATED-${suffix}`,
  noClass:
    `TEST-MB-NO-CLASS-${suffix}`,
  newStudent:
    `TEST-MB-NEW-${suffix}`,
}

let academicYearId: string | undefined
let classId: string | undefined

let monthlyPaymentTypeId: string | undefined
let oncePaymentTypeId: string | undefined
let noRatePaymentTypeId: string | undefined

const studentIds: string[] = []
const classHistoryIds: string[] = []
const invoiceIds: string[] = []

async function cleanupPreviousFixtures() {
  const oldStudents = await db
    .select({
      id: students.id,
    })
    .from(students)
    .where(
      like(
        students.studentCode,
        'TEST-MB-%',
      ),
    )

  const oldStudentIds =
    oldStudents.map(
      (student) => student.id,
    )

  if (oldStudentIds.length > 0) {
    await db
      .delete(invoices)
      .where(
        inArray(
          invoices.studentId,
          oldStudentIds,
        ),
      )

    await db
      .delete(studentClassHistories)
      .where(
        inArray(
          studentClassHistories.studentId,
          oldStudentIds,
        ),
      )

    await db
      .delete(students)
      .where(
        inArray(
          students.id,
          oldStudentIds,
        ),
      )
  }

  const oldAcademicYears = await db
    .select({
      id: academicYears.id,
    })
    .from(academicYears)
    .where(
      like(
        academicYears.code,
        'TEST-MONTHLY-BILLING-%',
      ),
    )

  const oldAcademicYearIds =
    oldAcademicYears.map(
      (academicYear) => academicYear.id,
    )

  if (oldAcademicYearIds.length > 0) {
    await db
      .delete(paymentRates)
      .where(
        inArray(
          paymentRates.academicYearId,
          oldAcademicYearIds,
        ),
      )

    await db
      .delete(academicYears)
      .where(
        inArray(
          academicYears.id,
          oldAcademicYearIds,
        ),
      )
  }

  await db
    .delete(paymentTypes)
    .where(
      like(
        paymentTypes.code,
        'TEST-MONTHLY-%',
      ),
    )

  await db
    .delete(paymentTypes)
    .where(
      like(
        paymentTypes.code,
        'TEST-ONCE-%',
      ),
    )

  await db
    .delete(paymentTypes)
    .where(
      like(
        paymentTypes.code,
        'TEST-NO-RATE-%',
      ),
    )

  await db
    .delete(classes)
    .where(
      like(
        classes.code,
        'TEST-MONTHLY-BILLING-%',
      ),
    )
}

await cleanupPreviousFixtures()

try {
  const academicYearRows =
    await db
      .insert(academicYears)
      .values({
        code: academicYearCode,
        name: 'Test Monthly Billing',
        startDate: '2026-07-01',
        endDate: '2027-06-30',
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

  academicYearId = academicYear.id

  console.log(
    'PASS: create academic year',
  )

  const classRows =
    await db
      .insert(classes)
      .values({
        code: classCode,
        name: 'Test Monthly Billing Class',
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

  classId = testClass.id

  console.log(
    'PASS: create class',
  )

  const monthlyPaymentTypeRows =
    await db
      .insert(paymentTypes)
      .values({
        code: monthlyPaymentTypeCode,
        name: 'Test Monthly SPP',
        nature: 'BULANAN',
        isActive: true,
        notes: 'Monthly billing test',
      })
      .returning()

  const monthlyPaymentType =
    monthlyPaymentTypeRows[0]

  if (!monthlyPaymentType) {
    throw new Error(
      'MONTHLY_PAYMENT_TYPE_CREATE_FAILED',
    )
  }

  monthlyPaymentTypeId =
    monthlyPaymentType.id

  const oncePaymentTypeRows =
    await db
      .insert(paymentTypes)
      .values({
        code: oncePaymentTypeCode,
        name: 'Test One Time Payment',
        nature: 'SEKALI',
        isActive: true,
        notes: 'Monthly billing exclusion test',
      })
      .returning()

  const oncePaymentType =
    oncePaymentTypeRows[0]

  if (!oncePaymentType) {
    throw new Error(
      'ONCE_PAYMENT_TYPE_CREATE_FAILED',
    )
  }

  oncePaymentTypeId =
    oncePaymentType.id

  const noRatePaymentTypeRows =
    await db
      .insert(paymentTypes)
      .values({
        code: noRatePaymentTypeCode,
        name: 'Test Monthly Without Rate',
        nature: 'BULANAN',
        isActive: true,
        notes: 'Rate missing test',
      })
      .returning()

  const noRatePaymentType =
    noRatePaymentTypeRows[0]

  if (!noRatePaymentType) {
    throw new Error(
      'NO_RATE_PAYMENT_TYPE_CREATE_FAILED',
    )
  }

  noRatePaymentTypeId =
    noRatePaymentType.id

  console.log(
    'PASS: create payment types',
  )

  const rateRows =
    await db
      .insert(paymentRates)
      .values({
        academicYearId,
        paymentTypeId: monthlyPaymentTypeId,
        amount: '150000.00',
        isActive: true,
      })
      .returning()

  const rate =
    rateRows[0]

  if (!rate) {
    throw new Error(
      'PAYMENT_RATE_CREATE_FAILED',
    )
  }

  console.log(
    'PASS: create monthly payment rate',
  )

  const createStudent =
    async (
      studentCode: string,
      entryDate: string,
      status:
        | 'ACTIVE'
        | 'TRANSFERRED'
        | 'GRADUATED',
      exitDate: string | null,
    ) => {
      const rows =
        await db
          .insert(students)
          .values({
            studentCode,
            fullName: `Test ${studentCode}`,
            entryDate,
            status,
            exitDate,
          })
          .returning()

      const student =
        rows[0]

      if (!student) {
        throw new Error(
          `STUDENT_CREATE_FAILED:${studentCode}`,
        )
      }

      studentIds.push(student.id)

      return student
    }

  const activeStudent =
    await createStudent(
      studentCodes.active,
      '2026-07-01',
      'ACTIVE',
      null,
    )

  const exitLaterStudent =
    await createStudent(
      studentCodes.exitLater,
      '2026-07-01',
      'TRANSFERRED',
      '2026-10-01',
    )

  const exitEqualStudent =
    await createStudent(
      studentCodes.exitEqual,
      '2026-07-01',
      'TRANSFERRED',
      '2026-09-01',
    )

  const entryLaterStudent =
    await createStudent(
      studentCodes.entryLater,
      '2026-10-01',
      'ACTIVE',
      null,
    )

  const graduatedStudent =
    await createStudent(
      studentCodes.graduated,
      '2026-07-01',
      'GRADUATED',
      '2026-11-01',
    )

  const noClassStudent =
    await createStudent(
      studentCodes.noClass,
      '2026-07-01',
      'ACTIVE',
      null,
    )

  console.log(
    'PASS: create student fixtures',
  )

  const eligibleStudentIds = [
    activeStudent.id,
    exitLaterStudent.id,
    graduatedStudent.id,
    noClassStudent.id,
  ]

  const classHistoryForStudent =
    async (
      studentId: string,
    ) => {
      const rows =
        await db
          .insert(studentClassHistories)
          .values({
            studentId,
            academicYearId,
            classId,
            startDate: '2026-07-01',
            endDate: null,
          })
          .returning()

      const history =
        rows[0]

      if (!history) {
        throw new Error(
          `CLASS_HISTORY_CREATE_FAILED:${studentId}`,
        )
      }

      classHistoryIds.push(history.id)

      return history
    }

  await classHistoryForStudent(
    activeStudent.id,
  )

  await classHistoryForStudent(
    exitLaterStudent.id,
  )

  await classHistoryForStudent(
    graduatedStudent.id,
  )

  console.log(
    'PASS: create class history fixtures',
  )

  const eligibleStudents =
    await service['studentRepository']
      .findBillingEligibleByPeriod(
        period,
      )

  const eligibleIds =
    new Set(
      eligibleStudents.map(
        (student) => student.id,
      ),
    )

  if (
    eligibleIds.size !== 4 ||
    !eligibleIds.has(activeStudent.id) ||
    !eligibleIds.has(exitLaterStudent.id) ||
    !eligibleIds.has(graduatedStudent.id) ||
    !eligibleIds.has(noClassStudent.id) ||
    eligibleIds.has(exitEqualStudent.id) ||
    eligibleIds.has(entryLaterStudent.id)
  ) {
    throw new Error(
      'BILLING_ELIGIBILITY_FIXTURE_FAILED',
    )
  }

  console.log(
    'PASS: historical billing eligibility',
  )

  const firstRun =
    await service.generate(period)

  if (
    firstRun.period !== period ||
    firstRun.academicYearId !== academicYearId ||
    firstRun.studentsScanned !== 4 ||
    firstRun.paymentTypesScanned !== 2 ||
    firstRun.generated !== 3 ||
    firstRun.skipped !== 0 ||
    firstRun.failed !== 5
  ) {
    throw new Error(
      `FIRST_RUN_SUMMARY_FAILED:${JSON.stringify(firstRun)}`,
    )
  }

  console.log(
    'PASS: first monthly billing run summary',
  )

  const createdItems =
    firstRun.items.filter(
      (item) =>
        item.status === 'CREATED',
    )

  if (
    createdItems.length !== 3 ||
    createdItems.some(
      (item) =>
        item.paymentTypeId !==
        monthlyPaymentTypeId,
    )
  ) {
    throw new Error(
      'CREATED_ITEMS_FAILED',
    )
  }

  console.log(
    'PASS: BULANAN invoices created',
  )

  const onceItems =
    firstRun.items.filter(
      (item) =>
        item.paymentTypeId ===
        oncePaymentTypeId,
    )

  if (onceItems.length !== 0) {
    throw new Error(
      'SEKALI_PAYMENT_TYPE_MUST_BE_EXCLUDED',
    )
  }

  console.log(
    'PASS: SEKALI payment type excluded',
  )

  const noClassItems =
    firstRun.items.filter(
      (item) =>
        item.studentId ===
        noClassStudent.id,
    )

  if (
    noClassItems.length !== 2 ||
    noClassItems.some(
      (item) =>
        item.status !== 'FAILED' ||
        item.errorCode !==
          'NO_ACTIVE_CLASS_HISTORY',
    )
  ) {
    throw new Error(
      'NO_CLASS_HISTORY_FAILED',
    )
  }

  console.log(
    'PASS: missing class history',
  )

  const noRateItems =
    firstRun.items.filter(
      (item) =>
        item.paymentTypeId ===
        noRatePaymentTypeId,
    )

  const noRateHistoryItems =
    noRateItems.filter(
      (item) =>
        item.studentId !==
        noClassStudent.id,
    )

  const noRateNoClassItem =
    noRateItems.find(
      (item) =>
        item.studentId ===
        noClassStudent.id,
    )

  if (
    noRateItems.length !== 4 ||
    noRateHistoryItems.length !== 3 ||
    noRateHistoryItems.some(
      (item) =>
        item.status !== 'FAILED' ||
        item.errorCode !==
          'RATE_NOT_FOUND',
    ) ||
    !noRateNoClassItem ||
    noRateNoClassItem.status !== 'FAILED' ||
    noRateNoClassItem.errorCode !==
      'NO_ACTIVE_CLASS_HISTORY'
  ) {
    throw new Error(
      'RATE_NOT_FOUND_FAILED',
    )
  }

  console.log(
    'PASS: missing payment rate',
  )

  const monthlyInvoices =
    await db
      .select()
      .from(invoices)
      .where(
        andInvoiceFilter(
          monthlyPaymentTypeId,
          period,
        ),
      )

  if (
    monthlyInvoices.length !== 3 ||
    monthlyInvoices.some(
      (invoice) =>
        invoice.nominal !==
          '150000.00' ||
        invoice.discount !==
          '0.00' ||
        invoice.payable !==
          '150000.00' ||
        invoice.status !==
          'UNPAID' ||
        invoice.dueDate !==
          '2026-09-10'
    )
  ) {
    throw new Error(
      'INVOICE_SNAPSHOT_FAILED',
    )
  }

  for (
    const invoice of monthlyInvoices
  ) {
    invoiceIds.push(invoice.id)
  }

  console.log(
    'PASS: invoice snapshot and due date',
  )

  const secondRun =
    await service.generate(period)

  if (
    secondRun.generated !== 0 ||
    secondRun.skipped !== 3 ||
    secondRun.failed !== 5
  ) {
    throw new Error(
      `IDEMPOTENCY_FAILED:${JSON.stringify(secondRun)}`,
    )
  }

  console.log(
    'PASS: second run is idempotent',
  )

  await db
    .update(paymentRates)
    .set({
      amount: '175000.00',
      updatedAt: new Date(),
    })
    .where(
      eq(
        paymentRates.id,
        rate.id,
      ),
    )

  const existingInvoice =
    monthlyInvoices[0]

  if (
    !existingInvoice ||
    existingInvoice.nominal !==
      '150000.00'
  ) {
    throw new Error(
      'RATE_SNAPSHOT_BEFORE_CHANGE_FAILED',
    )
  }

  const newStudentRows =
    await db
      .insert(students)
      .values({
        studentCode:
          studentCodes.newStudent,
        fullName:
          'Test New Monthly Billing Student',
        entryDate: '2026-07-01',
        status: 'ACTIVE',
        exitDate: null,
      })
      .returning()

  const newStudent =
    newStudentRows[0]

  if (!newStudent) {
    throw new Error(
      'NEW_STUDENT_CREATE_FAILED',
    )
  }

  studentIds.push(newStudent.id)

  await classHistoryForStudent(
    newStudent.id,
  )

  const thirdRun =
    await service.generate(period)

  if (
    thirdRun.generated !== 1 ||
    thirdRun.skipped !== 3 ||
    thirdRun.failed !== 6
  ) {
    throw new Error(
      `RATE_CHANGE_RUN_FAILED:${JSON.stringify(thirdRun)}`,
    )
  }

  const newInvoice =
    thirdRun.items.find(
      (item) =>
        item.status === 'CREATED' &&
        item.studentId ===
          newStudent.id &&
        item.paymentTypeId ===
          monthlyPaymentTypeId,
    )?.invoice

  if (
    !newInvoice ||
    newInvoice.nominal !==
      '175000.00' ||
    newInvoice.payable !==
      '175000.00'
  ) {
    throw new Error(
      'NEW_RATE_SNAPSHOT_FAILED',
    )
  }

  invoiceIds.push(
    newInvoice.id,
  )

  console.log(
    'PASS: rate snapshot is immutable per invoice',
  )

  const partialSuccessStudentRows =
    await db
      .insert(students)
      .values({
        studentCode:
          `TEST-MB-PARTIAL-SUCCESS-${suffix}`,
        fullName:
          'Test Partial Failure Success Student',
        entryDate: '2026-07-01',
        status: 'ACTIVE',
        exitDate: null,
      })
      .returning()

  const partialSuccessStudent =
    partialSuccessStudentRows[0]

  if (!partialSuccessStudent) {
    throw new Error(
      'PARTIAL_SUCCESS_STUDENT_CREATE_FAILED',
    )
  }

  studentIds.push(
    partialSuccessStudent.id,
  )

  await classHistoryForStudent(
    partialSuccessStudent.id,
  )

  const partialFailureStudentRows =
    await db
      .insert(students)
      .values({
        studentCode:
          `TEST-MB-PARTIAL-FAILURE-${suffix}`,
        fullName:
          'Test Partial Failure Failed Student',
        entryDate: '2026-07-01',
        status: 'ACTIVE',
        exitDate: null,
      })
      .returning()

  const partialFailureStudent =
    partialFailureStudentRows[0]

  if (!partialFailureStudent) {
    throw new Error(
      'PARTIAL_FAILURE_STUDENT_CREATE_FAILED',
    )
  }

  studentIds.push(
    partialFailureStudent.id,
  )

  await classHistoryForStudent(
    partialFailureStudent.id,
  )

  const failingService =
    new MonthlyBillingService(
      new FailingInvoiceRepository(
        partialFailureStudent.id,
      ),
    )

  const partialFailureRun =
    await failingService.generate(period)

  const partialSuccessItem =
    partialFailureRun.items.find(
      (item) =>
        item.studentId ===
          partialSuccessStudent.id &&
        item.paymentTypeId ===
          monthlyPaymentTypeId,
    )

  const partialFailureItem =
    partialFailureRun.items.find(
      (item) =>
        item.studentId ===
          partialFailureStudent.id &&
        item.paymentTypeId ===
          monthlyPaymentTypeId,
    )

  if (
    partialFailureRun.generated !== 1 ||
    partialSuccessItem?.status !==
      'CREATED' ||
    !partialSuccessItem.invoice ||
    partialFailureItem?.status !==
      'FAILED' ||
    partialFailureItem.errorCode !==
      'INVOICE_CREATE_FAILED'
  ) {
    throw new Error(
      `PARTIAL_FAILURE_RUN_FAILED:${JSON.stringify(
        partialFailureRun,
      )}`,
    )
  }

  invoiceIds.push(
    partialSuccessItem.invoice.id,
  )

  const partialSuccessInvoices =
    await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(
            invoices.studentId,
            partialSuccessStudent.id,
          ),
          eq(
            invoices.paymentTypeId,
            monthlyPaymentTypeId,
          ),
          eq(
            invoices.period,
            period,
          ),
        ),
      )

  const partialFailureInvoices =
    await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(
            invoices.studentId,
            partialFailureStudent.id,
          ),
          eq(
            invoices.paymentTypeId,
            monthlyPaymentTypeId,
          ),
          eq(
            invoices.period,
            period,
          ),
        ),
      )

  if (
    partialSuccessInvoices.length !== 1 ||
    partialFailureInvoices.length !== 0
  ) {
    throw new Error(
      'PARTIAL_FAILURE_DATABASE_STATE_FAILED',
    )
  }

  console.log(
    'PASS: partial failure does not rollback successful invoices',
  )

  const retryRun =
    await service.generate(period)

  const retryItem =
    retryRun.items.find(
      (item) =>
        item.studentId ===
          partialFailureStudent.id &&
        item.paymentTypeId ===
          monthlyPaymentTypeId,
    )

  if (
    retryItem?.status !== 'CREATED' ||
    !retryItem.invoice
  ) {
    throw new Error(
      `PARTIAL_FAILURE_RETRY_FAILED:${JSON.stringify(
        retryRun,
      )}`,
    )
  }

  invoiceIds.push(
    retryItem.invoice.id,
  )

  console.log(
    'PASS: partial failure can be retried successfully',
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
        existingInvoice.id,
      ),
    )

  const replacementRun =
    await service.generate(period)

  const replacementItem =
    replacementRun.items.find(
      (item) =>
        item.studentId ===
          existingInvoice.studentId &&
        item.paymentTypeId ===
          monthlyPaymentTypeId &&
        item.status === 'CREATED',
    )

  if (
    replacementRun.generated < 1 ||
    !replacementItem?.invoice ||
    replacementItem.invoice.id ===
      existingInvoice.id ||
    replacementItem.invoice.invoiceCode ===
      existingInvoice.invoiceCode ||
    replacementItem.invoice.status !==
      'UNPAID' ||
    replacementItem.invoice.nominal !==
      '175000.00'
  ) {
    throw new Error(
      `CANCELLED_REPLACEMENT_FAILED:${JSON.stringify(
        replacementRun,
      )}`,
    )
  }

  invoiceIds.push(
    replacementItem.invoice.id,
  )

  const cancelledInvoice =
    await db
      .select()
      .from(invoices)
      .where(
        eq(
          invoices.id,
          existingInvoice.id,
        ),
      )
      .limit(1)

  const activeInvoicesAfterReplacement =
    await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(
            invoices.studentId,
            existingInvoice.studentId,
          ),
          eq(
            invoices.academicYearId,
            existingInvoice.academicYearId,
          ),
          eq(
            invoices.paymentTypeId,
            existingInvoice.paymentTypeId,
          ),
          eq(
            invoices.period,
            period,
          ),
          sql`${invoices.status} <> 'CANCELLED'`,
        ),
      )

  if (
    cancelledInvoice.length !== 1 ||
    cancelledInvoice[0]?.status !==
      'CANCELLED' ||
    activeInvoicesAfterReplacement.length !==
      1
  ) {
    throw new Error(
      'CANCELLED_REPLACEMENT_STATE_FAILED',
    )
  }

  console.log(
    'PASS: cancelled invoice allows replacement',
  )

  const concurrencyStudentRows =
    await db
      .insert(students)
      .values({
        studentCode:
          `TEST-MB-CONCURRENCY-${suffix}`,
        fullName:
          'Test Monthly Billing Concurrency Student',
        entryDate: '2026-07-01',
        status: 'ACTIVE',
        exitDate: null,
      })
      .returning()

  const concurrencyStudent =
    concurrencyStudentRows[0]

  if (!concurrencyStudent) {
    throw new Error(
      'CONCURRENCY_STUDENT_CREATE_FAILED',
    )
  }

  studentIds.push(
    concurrencyStudent.id,
  )

  await classHistoryForStudent(
    concurrencyStudent.id,
  )

  const concurrentResults =
    await Promise.all([
      service.generate(period),
      service.generate(period),
    ])

  const concurrencyItems =
    concurrentResults.flatMap(
      (result) =>
        result.items.filter(
          (item) =>
            item.studentId ===
              concurrencyStudent.id &&
            item.paymentTypeId ===
              monthlyPaymentTypeId,
        ),
    )

  const concurrencyStatuses =
    concurrencyItems.map(
      (item) => item.status,
    )

  if (
    concurrencyItems.length !== 2 ||
    !concurrencyStatuses.includes(
      'CREATED',
    ) ||
    !concurrencyStatuses.includes(
      'SKIPPED',
    )
  ) {
    throw new Error(
      `CONCURRENT_RESULT_FAILED:${JSON.stringify(
        concurrentResults,
      )}`,
    )
  }

  const activeInvoicesAfterConcurrentRun =
    await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(
            invoices.studentId,
            concurrencyStudent.id,
          ),
          eq(
            invoices.academicYearId,
            academicYearId!,
          ),
          eq(
            invoices.paymentTypeId,
            monthlyPaymentTypeId,
          ),
          eq(
            invoices.period,
            period,
          ),
          sql`${invoices.status} <> 'CANCELLED'`,
        ),
      )

  if (
    activeInvoicesAfterConcurrentRun.length !==
      1
  ) {
    throw new Error(
      `CONCURRENT_DUPLICATE_FAILED:${JSON.stringify(
        concurrentResults,
      )}`,
    )
  }

  invoiceIds.push(
    activeInvoicesAfterConcurrentRun[0]!.id,
  )

  console.log(
    'PASS: concurrent generation creates exactly one invoice',
  )


  console.log(
    'MONTHLY BILLING SERVICE TEST: 15/15 PASS',
  )
} finally {
  if (studentIds.length > 0) {
    await db
      .delete(invoices)
      .where(
        inArray(
          invoices.studentId,
          studentIds,
        ),
      )
  }

  if (invoiceIds.length > 0) {
    await db
      .delete(invoices)
      .where(
        inArray(
          invoices.id,
          invoiceIds,
        ),
      )
  }

  if (classHistoryIds.length > 0) {
    await db
      .delete(studentClassHistories)
      .where(
        inArray(
          studentClassHistories.id,
          classHistoryIds,
        ),
      )
  }

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

  if (monthlyPaymentTypeId) {
    await db
      .delete(paymentRates)
      .where(
        eq(
          paymentRates.paymentTypeId,
          monthlyPaymentTypeId,
        ),
      )

    await db
      .delete(paymentTypes)
      .where(
        eq(
          paymentTypes.id,
          monthlyPaymentTypeId,
        ),
      )
  }

  if (noRatePaymentTypeId) {
    await db
      .delete(paymentTypes)
      .where(
        eq(
          paymentTypes.id,
          noRatePaymentTypeId,
        ),
      )
  }

  if (oncePaymentTypeId) {
    await db
      .delete(paymentTypes)
      .where(
        eq(
          paymentTypes.id,
          oncePaymentTypeId,
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

function andInvoiceFilter(
  paymentTypeId: string,
  invoicePeriod: string,
) {
  return and(
    eq(
      invoices.paymentTypeId,
      paymentTypeId,
    ),
    eq(
      invoices.period,
      invoicePeriod,
    ),
  )
}
