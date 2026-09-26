import { and, eq, inArray } from 'drizzle-orm'

import { db } from '../../src/db/index.ts'
import { academicYears } from '../../../../database/drizzle/schema/academic-years.ts'
import { classes } from '../../../../database/drizzle/schema/classes.ts'
import { students } from '../../../../database/drizzle/schema/students.ts'
import { paymentTypes } from '../../../../database/drizzle/schema/payment-types.ts'
import { invoices } from '../../../../database/drizzle/schema/invoices.ts'
import {
  InvoiceRepository,
} from '../../src/repositories/invoice.repository.ts'

const repository = new InvoiceRepository()

const suffix = Date.now()

const academicYearCode = `TEST-INVOICE-REPO-${suffix}`
const classCode = `TEST-INVOICE-REPO-${suffix}`
const studentCode = `TEST-INVOICE-REPO-${suffix}`
const paymentTypeCode = `TEST-INVOICE-REPO-${suffix}`
const invoiceCode = `INV-TEST-${suffix}`

let academicYearId: string | undefined
let classId: string | undefined
let studentId: string | undefined
let paymentTypeId: string | undefined
let invoiceId: string | undefined
let partialInvoiceId: string | undefined
let paidInvoiceId: string | undefined
let cancelledInvoiceId: string | undefined

try {
  const academicYearRows = await db
    .insert(academicYears)
    .values({
      code: academicYearCode,
      name: 'Test Invoice Repository',
      startDate: '2026-07-01',
      endDate: '2027-06-30',
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
      code: classCode,
      name: 'Test Invoice Class',
      level: 7,
      isActive: true,
    })
    .returning()

  const testClass = classRows[0]

  if (!testClass) {
    throw new Error(
      'CLASS_CREATE_FAILED',
    )
  }

  classId = testClass.id

  console.log('PASS: create class')

  const studentRows = await db
    .insert(students)
    .values({
      studentCode,
      fullName: 'Test Invoice Student',
      entryDate: '2026-07-01',
      status: 'ACTIVE',
      exitDate: null,
    })
    .returning()

  const student = studentRows[0]

  if (!student) {
    throw new Error(
      'STUDENT_CREATE_FAILED',
    )
  }

  studentId = student.id

  console.log('PASS: create student')

  const paymentTypeRows = await db
    .insert(paymentTypes)
    .values({
      code: paymentTypeCode,
      name: 'Test Invoice Payment Type',
      nature: 'BULANAN',
      isActive: true,
      notes: 'Invoice repository test',
    })
    .returning()

  const paymentType = paymentTypeRows[0]

  if (!paymentType) {
    throw new Error(
      'PAYMENT_TYPE_CREATE_FAILED',
    )
  }

  paymentTypeId = paymentType.id

  console.log('PASS: create payment type')

  const created = await repository.create({
    invoiceCode,
    studentId,
    academicYearId,
    classId,
    paymentTypeId,
    period: '2026-09-01',
    dueDate: '2026-09-10',
    nominal: '150000.00',
    discount: '0',
    payable: '150000.00',
  })

  if (
    created.invoiceCode !== invoiceCode ||
    created.studentId !== studentId ||
    created.academicYearId !== academicYearId ||
    created.classId !== classId ||
    created.paymentTypeId !== paymentTypeId ||
    created.period !== '2026-09-01' ||
    created.nominal !== '150000.00' ||
    created.discount !== '0.00' ||
    created.payable !== '150000.00' ||
    created.status !== 'UNPAID'
  ) {
    throw new Error('CREATE_FAILED')
  }

  invoiceId = created.id

  console.log('PASS: create')

  const foundById = await repository.findById(
    invoiceId,
  )

  if (
    !foundById ||
    foundById.id !== invoiceId ||
    foundById.invoiceCode !== invoiceCode
  ) {
    throw new Error('FIND_BY_ID_FAILED')
  }

  console.log('PASS: findById')

  const foundByCode =
    await repository.findByInvoiceCode(
      invoiceCode,
    )

  if (
    !foundByCode ||
    foundByCode.id !== invoiceId
  ) {
    throw new Error(
      'FIND_BY_INVOICE_CODE_FAILED',
    )
  }

  console.log('PASS: findByInvoiceCode')

  const activeUnpaid =
    await repository.findActiveByStudentYearTypePeriod(
      studentId,
      academicYearId,
      paymentTypeId,
      '2026-09-01',
    )

  if (
    !activeUnpaid ||
    activeUnpaid.id !== invoiceId ||
    activeUnpaid.status !== 'UNPAID'
  ) {
    throw new Error(
      'FIND_ACTIVE_UNPAID_FAILED',
    )
  }

  console.log('PASS: find active UNPAID')

  const partialRows = await db
    .update(invoices)
    .set({
      status: 'PARTIAL',
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId))
    .returning()

  const partialInvoice = partialRows[0]

  if (
    !partialInvoice ||
    partialInvoice.status !== 'PARTIAL'
  ) {
    throw new Error(
      'SET_PARTIAL_FAILED',
    )
  }

  const activePartial =
    await repository.findActiveByStudentYearTypePeriod(
      studentId,
      academicYearId,
      paymentTypeId,
      '2026-09-01',
    )

  if (
    !activePartial ||
    activePartial.id !== invoiceId ||
    activePartial.status !== 'PARTIAL'
  ) {
    throw new Error(
      'FIND_ACTIVE_PARTIAL_FAILED',
    )
  }

  console.log('PASS: find active PARTIAL')

  const paidRows = await db
    .update(invoices)
    .set({
      status: 'PAID',
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId))
    .returning()

  const paidInvoice = paidRows[0]

  if (
    !paidInvoice ||
    paidInvoice.status !== 'PAID'
  ) {
    throw new Error(
      'SET_PAID_FAILED',
    )
  }

  const activePaid =
    await repository.findActiveByStudentYearTypePeriod(
      studentId,
      academicYearId,
      paymentTypeId,
      '2026-09-01',
    )

  if (
    !activePaid ||
    activePaid.id !== invoiceId ||
    activePaid.status !== 'PAID'
  ) {
    throw new Error(
      'FIND_ACTIVE_PAID_FAILED',
    )
  }

  console.log('PASS: find active PAID')

  const cancelledRows = await db
    .insert(invoices)
    .values({
      invoiceCode: `${invoiceCode}-CANCELLED`,
      studentId,
      academicYearId,
      classId,
      paymentTypeId,
      period: '2026-10-01',
      dueDate: '2026-10-10',
      nominal: '150000.00',
      discount: '0',
      payable: '150000.00',
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledReason: 'Repository test cancellation',
    })
    .returning()

  const cancelledInvoiceRow =
    cancelledRows[0]

  if (!cancelledInvoiceRow) {
    throw new Error(
      'CANCELLED_INVOICE_CREATE_FAILED',
    )
  }

  cancelledInvoiceId =
    cancelledInvoiceRow.id

  const activeCancelled =
    await repository.findActiveByStudentYearTypePeriod(
      studentId,
      academicYearId,
      paymentTypeId,
      '2026-10-01',
    )

  if (activeCancelled !== null) {
    throw new Error(
      'CANCELLED_INVOICE_MUST_NOT_BE_ACTIVE',
    )
  }

  console.log(
    'PASS: cancelled invoice is not active',
  )

  const secondRows = await db
    .insert(invoices)
    .values({
      invoiceCode: `${invoiceCode}-PARTIAL`,
      studentId,
      academicYearId,
      classId,
      paymentTypeId,
      period: '2026-11-01',
      dueDate: '2026-11-10',
      nominal: '150000.00',
      discount: '0',
      payable: '150000.00',
      status: 'PARTIAL',
    })
    .returning()

  const secondInvoice = secondRows[0]

  if (!secondInvoice) {
    throw new Error(
      'PARTIAL_INVOICE_CREATE_FAILED',
    )
  }

  partialInvoiceId = secondInvoice.id

  const thirdRows = await db
    .insert(invoices)
    .values({
      invoiceCode: `${invoiceCode}-PAID`,
      studentId,
      academicYearId,
      classId,
      paymentTypeId,
      period: '2026-12-01',
      dueDate: '2026-12-10',
      nominal: '150000.00',
      discount: '0',
      payable: '150000.00',
      status: 'PAID',
    })
    .returning()

  const thirdInvoice = thirdRows[0]

  if (!thirdInvoice) {
    throw new Error(
      'PAID_INVOICE_CREATE_FAILED',
    )
  }

  paidInvoiceId = thirdInvoice.id

  const listed = await repository.list({
    studentId,
    page: 1,
    perPage: 100,
  })

  if (
    listed.total !== 4 ||
    listed.data.length !== 4 ||
    !listed.data.some(
      (item) => item.id === invoiceId,
    ) ||
    !listed.data.some(
      (item) => item.id === cancelledInvoiceId,
    ) ||
    !listed.data.some(
      (item) => item.id === partialInvoiceId,
    ) ||
    !listed.data.some(
      (item) => item.id === paidInvoiceId,
    )
  ) {
    throw new Error(
      'LIST_STUDENT_FAILED',
    )
  }

  console.log('PASS: list by student')

  const paidList = await repository.list({
    studentId,
    status: 'PAID',
    page: 1,
    perPage: 100,
  })

  if (
    paidList.total !== 2 ||
    paidList.data.length !== 2
  ) {
    throw new Error(
      'LIST_STATUS_PAID_FAILED',
    )
  }

  console.log('PASS: list status PAID')

  const paged = await repository.list({
    studentId,
    page: 1,
    perPage: 2,
    sortBy: 'period',
    sortDirection: 'asc',
  })

  if (
    paged.total !== 4 ||
    paged.data.length !== 2 ||
    paged.data[0]?.period !== '2026-09-01' ||
    paged.data[1]?.period !== '2026-10-01'
  ) {
    throw new Error(
      'PAGINATION_FAILED',
    )
  }

  console.log('PASS: pagination + sorting')

  let duplicateRejected = false

  try {
    await repository.create({
      invoiceCode: `${invoiceCode}-DUPLICATE`,
      studentId,
      academicYearId,
      classId,
      paymentTypeId,
      period: '2026-09-01',
      dueDate: '2026-09-10',
      nominal: '150000.00',
      discount: '0',
      payable: '150000.00',
    })
  } catch {
    duplicateRejected = true
  }

  if (!duplicateRejected) {
    throw new Error(
      'DUPLICATE_INVOICE_MUST_BE_REJECTED',
    )
  }

  console.log(
    'PASS: duplicate active invoice rejected',
  )

  console.log(
    'INVOICE REPOSITORY TEST: 12/12 PASS',
  )
} finally {
  if (invoiceId) {
    await db
      .delete(invoices)
      .where(
        eq(invoices.id, invoiceId),
      )
  }

  if (cancelledInvoiceId) {
    await db
      .delete(invoices)
      .where(
        eq(
          invoices.id,
          cancelledInvoiceId,
        ),
      )
  }

  if (partialInvoiceId) {
    await db
      .delete(invoices)
      .where(
        eq(
          invoices.id,
          partialInvoiceId,
        ),
      )
  }

  if (paidInvoiceId) {
    await db
      .delete(invoices)
      .where(
        eq(
          invoices.id,
          paidInvoiceId,
        ),
      )
  }

  if (studentId) {
    await db
      .delete(students)
      .where(
        eq(students.id, studentId),
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
        eq(classes.id, classId),
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

  console.log('DATABASE CLEANUP: OK')
}
