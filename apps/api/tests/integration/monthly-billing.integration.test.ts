import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
} from 'bun:test'

import { and, eq, like } from 'drizzle-orm'

import { createApp } from '../../src/app.ts'
import { db } from '../../src/db/index.ts'

import { academicYears } from '../../../../database/drizzle/schema/academic-years.ts'
import { classes } from '../../../../database/drizzle/schema/classes.ts'
import { invoices } from '../../../../database/drizzle/schema/invoices.ts'
import { paymentRates } from '../../../../database/drizzle/schema/payment-rates.ts'
import { paymentTypes } from '../../../../database/drizzle/schema/payment-types.ts'
import { studentClassHistories } from '../../../../database/drizzle/schema/student-class-histories.ts'
import { students } from '../../../../database/drizzle/schema/students.ts'

describe('Monthly Billing API integration', () => {
  const suffix = Date.now()
  const period = '2026-09-01'

  const academicYearCode =
    `TEST-MB-API-${suffix}`

  const classCode =
    `TEST-MB-API-${suffix}`

  const paymentTypeCode =
    `TEST-MB-API-${suffix}`

  const studentCode =
    `TEST-MB-API-${suffix}`

  let academicYearId: string | undefined
  let classId: string | undefined
  let paymentTypeId: string | undefined
  let studentId: string | undefined

  beforeAll(async () => {
    const academicYearRows = await db
      .insert(academicYears)
      .values({
        code: academicYearCode,
        name: 'Test Monthly Billing API',
        startDate: '2026-07-01',
        endDate: '2027-06-30',
        isActive: false,
      })
      .returning()

    const academicYear = academicYearRows[0]

    if (!academicYear) {
      throw new Error(
        'INTEGRATION_ACADEMIC_YEAR_CREATE_FAILED',
      )
    }

    academicYearId = academicYear.id

    const classRows = await db
      .insert(classes)
      .values({
        code: classCode,
        name: 'Test Monthly Billing API Class',
        level: 7,
        isActive: true,
      })
      .returning()

    const testClass = classRows[0]

    if (!testClass) {
      throw new Error(
        'INTEGRATION_CLASS_CREATE_FAILED',
      )
    }

    classId = testClass.id

    const paymentTypeRows = await db
      .insert(paymentTypes)
      .values({
        code: paymentTypeCode,
        name: 'Test Monthly Billing API',
        nature: 'BULANAN',
        isActive: true,
        notes: 'Monthly billing API integration test',
      })
      .returning()

    const paymentType = paymentTypeRows[0]

    if (!paymentType) {
      throw new Error(
        'INTEGRATION_PAYMENT_TYPE_CREATE_FAILED',
      )
    }

    paymentTypeId = paymentType.id

    await db
      .insert(paymentRates)
      .values({
        academicYearId,
        paymentTypeId,
        amount: '150000.00',
        isActive: true,
      })

    const studentRows = await db
      .insert(students)
      .values({
        studentCode,
        fullName: 'Test Monthly Billing API Student',
        entryDate: '2026-07-01',
        status: 'ACTIVE',
        exitDate: null,
      })
      .returning()

    const student = studentRows[0]

    if (!student) {
      throw new Error(
        'INTEGRATION_STUDENT_CREATE_FAILED',
      )
    }

    studentId = student.id

    await db
      .insert(studentClassHistories)
      .values({
        studentId,
        academicYearId,
        classId,
        startDate: '2026-07-01',
        endDate: null,
      })
  })

  afterAll(async () => {
    if (studentId) {
      await db
        .delete(invoices)
        .where(
          eq(
            invoices.studentId,
            studentId,
          ),
        )

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
        .delete(paymentRates)
        .where(
          eq(
            paymentRates.paymentTypeId,
            paymentTypeId,
          ),
        )

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
  })

  test(
    'POST /api/monthly-billing creates invoice through real database',
    async () => {
      const app = createApp()

      const response = await app.handle(
        new Request(
          'http://localhost/api/monthly-billing',
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              period,
            }),
          },
        ),
      )

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body.data.period).toBe(period)
      expect(body.data.academicYearId).toBe(
        academicYearId,
      )
      expect(body.data.studentsScanned).toBe(1)
      expect(body.data.paymentTypesScanned).toBe(1)
      expect(body.data.generated).toBe(1)
      expect(body.data.skipped).toBe(0)
      expect(body.data.failed).toBe(0)

      expect(body.data.items).toHaveLength(1)

      const item = body.data.items[0]

      expect(item.studentId).toBe(studentId)
      expect(item.paymentTypeId).toBe(
        paymentTypeId,
      )
      expect(item.status).toBe('CREATED')
      expect(item.invoice).toBeDefined()
      expect(item.invoice.nominal).toBe(
        '150000.00',
      )
      expect(item.invoice.discount).toBe(
        '0.00',
      )
      expect(item.invoice.payable).toBe(
        '150000.00',
      )
      expect(item.invoice.status).toBe(
        'UNPAID',
      )
      expect(item.invoice.dueDate).toBe(
        '2026-09-10',
      )

      const databaseInvoices = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(
              invoices.studentId,
              studentId!,
            ),
            eq(
              invoices.academicYearId,
              academicYearId!,
            ),
            eq(
              invoices.paymentTypeId,
              paymentTypeId!,
            ),
            eq(
              invoices.period,
              period,
            ),
          ),
        )

      expect(databaseInvoices).toHaveLength(1)

      const databaseInvoice =
        databaseInvoices[0]

      expect(databaseInvoice).toBeDefined()
      expect(databaseInvoice!.nominal).toBe(
        '150000.00',
      )
      expect(databaseInvoice!.discount).toBe(
        '0.00',
      )
      expect(databaseInvoice!.payable).toBe(
        '150000.00',
      )
      expect(databaseInvoice!.status).toBe(
        'UNPAID',
      )
      expect(databaseInvoice!.dueDate).toBe(
        '2026-09-10',
      )
    },
  )

  test(
    'POST /api/monthly-billing is idempotent through HTTP',
    async () => {
      const app = createApp()

      const response = await app.handle(
        new Request(
          'http://localhost/api/monthly-billing',
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              period,
            }),
          },
        ),
      )

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body.data.generated).toBe(0)
      expect(body.data.skipped).toBe(1)
      expect(body.data.failed).toBe(0)

      expect(body.data.items).toHaveLength(1)

      expect(
        body.data.items[0].status,
      ).toBe('SKIPPED')

      const databaseInvoices = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(
              invoices.studentId,
              studentId!,
            ),
            eq(
              invoices.academicYearId,
              academicYearId!,
            ),
            eq(
              invoices.paymentTypeId,
              paymentTypeId!,
            ),
            eq(
              invoices.period,
              period,
            ),
          ),
        )

      expect(databaseInvoices).toHaveLength(1)
    },
  )

  test(
    'created invoice has correct database ownership references',
    async () => {
      const databaseInvoices = await db
        .select()
        .from(invoices)
        .where(
          like(
            invoices.invoiceCode,
            `INV-202609-%`,
          ),
        )

      const testInvoice =
        databaseInvoices.find(
          (invoice) =>
            invoice.studentId ===
              studentId &&
            invoice.academicYearId ===
              academicYearId &&
            invoice.paymentTypeId ===
              paymentTypeId &&
            invoice.period === period,
        )

      expect(testInvoice).toBeDefined()

      expect(
        testInvoice!.studentId,
      ).toBe(studentId)

      expect(
        testInvoice!.academicYearId,
      ).toBe(academicYearId)

      expect(
        testInvoice!.paymentTypeId,
      ).toBe(paymentTypeId)

      expect(
        testInvoice!.classId,
      ).toBe(classId)

      expect(
        testInvoice!.period,
      ).toBe(period)
    },
  )
})
