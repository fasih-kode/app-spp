import {
  and,
  asc,
  count,
  desc,
  eq,
  sql,
} from 'drizzle-orm'
import type { PgDatabase } from 'drizzle-orm/pg-core'

import { db } from '../db/index.ts'
import { invoices } from '../../../../database/drizzle/schema/invoices.ts'

type InvoiceDb = PgDatabase<any, any, any>

export type Invoice = typeof invoices.$inferSelect

export type InvoiceStatus = Invoice['status']

export type CreateInvoiceData = {
  invoiceCode: string
  studentId: string
  academicYearId: string
  classId: string
  paymentTypeId: string
  period: string
  dueDate: string
  nominal: string
  discount?: string
  payable: string
  status?: InvoiceStatus
  discountReason?: string | null
  notes?: string | null
}

export type InvoiceListParams = {
  studentId?: string
  academicYearId?: string
  classId?: string
  paymentTypeId?: string
  period?: string
  status?: InvoiceStatus
  page?: number
  perPage?: number
  sortBy?: InvoiceSortField
  sortDirection?: 'asc' | 'desc'
}

export type InvoiceSortField =
  | 'period'
  | 'dueDate'
  | 'invoiceCode'
  | 'nominal'
  | 'payable'
  | 'status'
  | 'createdAt'

export type InvoiceListResult = {
  data: Invoice[]
  total: number
}

export interface InvoiceRepositoryContract {
  findById(id: string): Promise<Invoice | null>

  findByInvoiceCode(
    invoiceCode: string,
  ): Promise<Invoice | null>

  findActiveByStudentYearTypePeriod(
    studentId: string,
    academicYearId: string,
    paymentTypeId: string,
    period: string,
  ): Promise<Invoice | null>

  hasInvoicesByAcademicYearAndPaymentType(
    academicYearId: string,
    paymentTypeId: string,
  ): Promise<boolean>

  list(
    params?: InvoiceListParams,
  ): Promise<InvoiceListResult>

  create(
    data: CreateInvoiceData,
  ): Promise<Invoice>
}

export class InvoiceRepository
  implements InvoiceRepositoryContract
{
  constructor(
    private readonly executor: InvoiceDb = db,
  ) {}

  withExecutor(
    executor: InvoiceDb,
  ): InvoiceRepository {
    return new InvoiceRepository(executor)
  }

  async findById(
    id: string,
  ): Promise<Invoice | null> {
    const rows = await this.executor
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1)

    return rows[0] ?? null
  }

  async findByInvoiceCode(
    invoiceCode: string,
  ): Promise<Invoice | null> {
    const rows = await this.executor
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceCode, invoiceCode))
      .limit(1)

    return rows[0] ?? null
  }

  async findActiveByStudentYearTypePeriod(
    studentId: string,
    academicYearId: string,
    paymentTypeId: string,
    period: string,
  ): Promise<Invoice | null> {
    const rows = await this.executor
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.studentId, studentId),
          eq(invoices.academicYearId, academicYearId),
          eq(invoices.paymentTypeId, paymentTypeId),
          eq(invoices.period, period),
          sql`${invoices.status} <> 'CANCELLED'`,
        ),
      )
      .limit(1)

    return rows[0] ?? null
  }

  async hasInvoicesByAcademicYearAndPaymentType(
    academicYearId: string,
    paymentTypeId: string,
  ): Promise<boolean> {
    const rows = await this.executor
      .select({
        id: invoices.id,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.academicYearId, academicYearId),
          eq(invoices.paymentTypeId, paymentTypeId),
        ),
      )
      .limit(1)

    return rows.length > 0
  }

  async list(
    params: InvoiceListParams = {},
  ): Promise<InvoiceListResult> {
    const page = Math.max(
      1,
      params.page ?? 1,
    )

    const perPage = Math.min(
      100,
      Math.max(
        1,
        params.perPage ?? 20,
      ),
    )

    const offset = (page - 1) * perPage

    const conditions = []

    if (params.studentId) {
      conditions.push(
        eq(
          invoices.studentId,
          params.studentId,
        ),
      )
    }

    if (params.academicYearId) {
      conditions.push(
        eq(
          invoices.academicYearId,
          params.academicYearId,
        ),
      )
    }

    if (params.classId) {
      conditions.push(
        eq(
          invoices.classId,
          params.classId,
        ),
      )
    }

    if (params.paymentTypeId) {
      conditions.push(
        eq(
          invoices.paymentTypeId,
          params.paymentTypeId,
        ),
      )
    }

    if (params.period) {
      conditions.push(
        eq(
          invoices.period,
          params.period,
        ),
      )
    }

    if (params.status) {
      conditions.push(
        eq(
          invoices.status,
          params.status,
        ),
      )
    }

    const whereClause =
      conditions.length > 0
        ? and(...conditions)
        : undefined

    const sortColumn = {
      period: invoices.period,
      dueDate: invoices.dueDate,
      invoiceCode: invoices.invoiceCode,
      nominal: invoices.nominal,
      payable: invoices.payable,
      status: invoices.status,
      createdAt: invoices.createdAt,
    }[params.sortBy ?? 'period']

    const orderBy =
      params.sortDirection === 'desc'
        ? desc(sortColumn)
        : asc(sortColumn)

    const [rows, totalRows] =
      await Promise.all([
        this.executor
          .select()
          .from(invoices)
          .where(whereClause)
          .orderBy(orderBy)
          .limit(perPage)
          .offset(offset),

        this.executor
          .select({
            count: count(),
          })
          .from(invoices)
          .where(whereClause),
      ])

    return {
      data: rows,
      total: Number(
        totalRows[0]?.count ?? 0,
      ),
    }
  }

  async create(
    data: CreateInvoiceData,
  ): Promise<Invoice> {
    const rows = await this.executor
      .insert(invoices)
      .values({
        invoiceCode: data.invoiceCode,
        studentId: data.studentId,
        academicYearId: data.academicYearId,
        classId: data.classId,
        paymentTypeId: data.paymentTypeId,
        period: data.period,
        dueDate: data.dueDate,
        nominal: data.nominal,
        discount: data.discount ?? '0',
        payable: data.payable,
        status: data.status ?? 'UNPAID',
        discountReason:
          data.discountReason ?? null,
        notes: data.notes ?? null,
      })
      .returning()

    const created = rows[0]

    if (!created) {
      throw new Error(
        'INVOICE_CREATE_FAILED',
      )
    }

    return created
  }
}
