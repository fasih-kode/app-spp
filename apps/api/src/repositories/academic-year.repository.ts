import {
  asc,
  and,
  eq,
  gte,
  lte,
  sql,
} from 'drizzle-orm'
import type { PgDatabase } from 'drizzle-orm/pg-core'

import { db } from '../db/index.ts'
import { academicYears } from '../../../../database/drizzle/schema/academic-years.ts'

type AcademicYearDb = PgDatabase<any, any, any>

export type AcademicYear =
  typeof academicYears.$inferSelect

export type AcademicYearListParams = {
  isActive?: boolean
  page?: number
  perPage?: number
}

export type AcademicYearListResult = {
  items: AcademicYear[]
  total: number
}

export class AcademicYearRepository {
  constructor(
    private readonly executor: AcademicYearDb =
      db as AcademicYearDb,
  ) {}

  withExecutor(
    executor: AcademicYearDb,
  ): AcademicYearRepository {
    return new AcademicYearRepository(executor)
  }

  async findById(
    id: string,
  ): Promise<AcademicYear | null> {
    const rows = await this.executor
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, id))
      .limit(1)

    return rows[0] ?? null
  }

  async findByPeriod(
    period: string,
  ): Promise<AcademicYear | null> {
    const rows = await this.executor
      .select()
      .from(academicYears)
      .where(
        and(
          lte(academicYears.startDate, period),
          gte(academicYears.endDate, period),
        ),
      )
      .limit(1)

    return rows[0] ?? null
  }

  async list(
    params: AcademicYearListParams = {},
  ): Promise<AcademicYearListResult> {
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

    const whereClause =
      params.isActive === undefined
        ? undefined
        : eq(
            academicYears.isActive,
            params.isActive,
          )

    const items = await this.executor
      .select()
      .from(academicYears)
      .where(whereClause)
      .orderBy(
        asc(academicYears.startDate),
        asc(academicYears.code),
      )
      .limit(perPage)
      .offset(offset)

    const countResult =
      await this.executor.execute<{ count: number }>(
        sql`
          SELECT COUNT(*)::int AS count
          FROM ${academicYears}
          ${
            whereClause
              ? sql`WHERE ${whereClause}`
              : sql``
          }
        `,
      )

    return {
      items,
      total: Number(
        countResult[0]?.count ?? 0,
      ),
    }
  }
}
