import { and, asc, eq, ilike, or, sql } from 'drizzle-orm'
import type { PgDatabase } from 'drizzle-orm/pg-core'

import { db } from '../db/index.ts'
import { paymentTypes } from '../../../../database/drizzle/schema/payment-types.ts'

type PaymentTypeDb = PgDatabase<any, any, any>

export type PaymentType = typeof paymentTypes.$inferSelect

export type CreatePaymentTypeData = {
  code: string
  name: string
  nature: string
  isActive?: boolean
  notes?: string | null
}

export type UpdatePaymentTypeData = {
  code?: string
  name?: string
  nature?: string
  isActive?: boolean
  notes?: string | null
}

export type PaymentTypeListParams = {
  search?: string
  isActive?: boolean
  page?: number
  perPage?: number
}

export type PaymentTypeListResult = {
  items: PaymentType[]
  total: number
}

export class PaymentTypeRepository {
  constructor(
    private readonly executor: PaymentTypeDb = db as PaymentTypeDb,
  ) {}

  withExecutor(executor: PaymentTypeDb): PaymentTypeRepository {
    return new PaymentTypeRepository(executor)
  }

  async findById(id: string): Promise<PaymentType | null> {
    const rows = await this.executor
      .select()
      .from(paymentTypes)
      .where(eq(paymentTypes.id, id))
      .limit(1)

    return rows[0] ?? null
  }

  async findByCode(code: string): Promise<PaymentType | null> {
    const rows = await this.executor
      .select()
      .from(paymentTypes)
      .where(eq(paymentTypes.code, code))
      .limit(1)

    return rows[0] ?? null
  }

  async list(
    params: PaymentTypeListParams = {},
  ): Promise<PaymentTypeListResult> {
    const page = Math.max(1, params.page ?? 1)
    const perPage = Math.min(100, Math.max(1, params.perPage ?? 20))
    const offset = (page - 1) * perPage

    const conditions = []

    if (params.isActive !== undefined) {
      conditions.push(eq(paymentTypes.isActive, params.isActive))
    }

    if (params.search?.trim()) {
      const search = `%${params.search.trim()}%`

      conditions.push(
        or(
          ilike(paymentTypes.code, search),
          ilike(paymentTypes.name, search),
          ilike(paymentTypes.nature, search),
        ),
      )
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined

    const items = await this.executor
      .select()
      .from(paymentTypes)
      .where(whereClause)
      .orderBy(asc(paymentTypes.name), asc(paymentTypes.code))
      .limit(perPage)
      .offset(offset)

    const countResult = await this.executor.execute<{ count: number }>(
      sql`
        SELECT COUNT(*)::int AS count
        FROM ${paymentTypes}
        ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      `,
    )

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    }
  }

  async create(
    data: CreatePaymentTypeData,
  ): Promise<PaymentType> {
    const rows = await this.executor
      .insert(paymentTypes)
      .values({
        code: data.code,
        name: data.name,
        nature: data.nature,
        isActive: data.isActive ?? true,
        notes: data.notes ?? null,
      })
      .returning()

    const created = rows[0]

    if (!created) {
      throw new Error('PAYMENT_TYPE_CREATE_FAILED')
    }

    return created
  }

  async update(
    id: string,
    data: UpdatePaymentTypeData,
  ): Promise<PaymentType | null> {
    const rows = await this.executor
      .update(paymentTypes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(paymentTypes.id, id))
      .returning()

    return rows[0] ?? null
  }

  async setActive(
    id: string,
    isActive: boolean,
  ): Promise<PaymentType | null> {
    const rows = await this.executor
      .update(paymentTypes)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(paymentTypes.id, id))
      .returning()

    return rows[0] ?? null
  }
}
