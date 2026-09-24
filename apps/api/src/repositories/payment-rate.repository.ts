import {
  and,
  asc,
  eq,
  sql,
} from 'drizzle-orm'
import type { PgDatabase } from 'drizzle-orm/pg-core'

import { db } from '../db/index.ts'
import { paymentRates } from '../../../../database/drizzle/schema/payment-rates.ts'

type PaymentRateDb = PgDatabase<any, any, any>

export type PaymentRate = typeof paymentRates.$inferSelect

export type CreatePaymentRateData = {
  academicYearId: string
  paymentTypeId: string
  amount: string
  isActive?: boolean
}

export type UpdatePaymentRateData = {
  academicYearId?: string
  paymentTypeId?: string
  amount?: string
  isActive?: boolean
}

export type PaymentRateListParams = {
  academicYearId?: string
  paymentTypeId?: string
  isActive?: boolean
  page?: number
  perPage?: number
}

export type PaymentRateListResult = {
  items: PaymentRate[]
  total: number
}

export class PaymentRateRepository {
  constructor(
    private readonly executor: PaymentRateDb = db as PaymentRateDb,
  ) {}

  withExecutor(executor: PaymentRateDb): PaymentRateRepository {
    return new PaymentRateRepository(executor)
  }

  async findById(id: string): Promise<PaymentRate | null> {
    const rows = await this.executor
      .select()
      .from(paymentRates)
      .where(eq(paymentRates.id, id))
      .limit(1)

    return rows[0] ?? null
  }

  async findByAcademicYearAndPaymentType(
    academicYearId: string,
    paymentTypeId: string,
    activeOnly = true,
  ): Promise<PaymentRate | null> {
    const conditions = [
      eq(paymentRates.academicYearId, academicYearId),
      eq(paymentRates.paymentTypeId, paymentTypeId),
    ]

    if (activeOnly) {
      conditions.push(eq(paymentRates.isActive, true))
    }

    const rows = await this.executor
      .select()
      .from(paymentRates)
      .where(and(...conditions))
      .orderBy(asc(paymentRates.createdAt))
      .limit(1)

    return rows[0] ?? null
  }

  async list(
    params: PaymentRateListParams = {},
  ): Promise<PaymentRateListResult> {
    const page = Math.max(1, params.page ?? 1)
    const perPage = Math.min(
      100,
      Math.max(1, params.perPage ?? 20),
    )
    const offset = (page - 1) * perPage

    const conditions = []

    if (params.academicYearId) {
      conditions.push(
        eq(
          paymentRates.academicYearId,
          params.academicYearId,
        ),
      )
    }

    if (params.paymentTypeId) {
      conditions.push(
        eq(
          paymentRates.paymentTypeId,
          params.paymentTypeId,
        ),
      )
    }

    if (params.isActive !== undefined) {
      conditions.push(
        eq(
          paymentRates.isActive,
          params.isActive,
        ),
      )
    }

    const whereClause =
      conditions.length > 0
        ? and(...conditions)
        : undefined

    const items = await this.executor
      .select()
      .from(paymentRates)
      .where(whereClause)
      .orderBy(
        asc(paymentRates.academicYearId),
        asc(paymentRates.paymentTypeId),
        asc(paymentRates.createdAt),
      )
      .limit(perPage)
      .offset(offset)

    const countResult =
      await this.executor.execute<{ count: number }>(
        sql`
          SELECT COUNT(*)::int AS count
          FROM ${paymentRates}
          ${
            whereClause
              ? sql`WHERE ${whereClause}`
              : sql``
          }
        `,
      )

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    }
  }

  async create(
    data: CreatePaymentRateData,
  ): Promise<PaymentRate> {
    const rows = await this.executor
      .insert(paymentRates)
      .values({
        academicYearId: data.academicYearId,
        paymentTypeId: data.paymentTypeId,
        amount: data.amount,
        isActive: data.isActive ?? true,
      })
      .returning()

    const created = rows[0]

    if (!created) {
      throw new Error('PAYMENT_RATE_CREATE_FAILED')
    }

    return created
  }

  async update(
    id: string,
    data: UpdatePaymentRateData,
  ): Promise<PaymentRate | null> {
    const rows = await this.executor
      .update(paymentRates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(paymentRates.id, id))
      .returning()

    return rows[0] ?? null
  }

  async setActive(
    id: string,
    isActive: boolean,
  ): Promise<PaymentRate | null> {
    const rows = await this.executor
      .update(paymentRates)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(paymentRates.id, id))
      .returning()

    return rows[0] ?? null
  }
}
