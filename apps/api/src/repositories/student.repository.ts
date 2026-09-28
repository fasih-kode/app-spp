import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  lte,
  ne,
  or,
  isNull,
} from 'drizzle-orm'
import type { PgDatabase } from 'drizzle-orm/pg-core'
import { db } from '../db/index.ts'
import { students } from '../../../../database/drizzle/schema/students.ts'
import type {
  CreateStudentData,
  Student,
  StudentListParams,
  StudentListResult,
  StudentStatus,
  UpdateStudentData,
} from '../types/student.ts'

type StudentDb = PgDatabase<any, any, any>

export interface StudentRepositoryContract {
  findById(id: string): Promise<Student | null>

  findByStudentCode(studentCode: string): Promise<Student | null>

  findByNis(nis: string): Promise<Student | null>

  findByNisn(nisn: string): Promise<Student | null>

  findBillingEligibleByPeriod(
    period: string,
  ): Promise<Student[]>

  list(params: StudentListParams): Promise<StudentListResult>

  create(data: CreateStudentData): Promise<Student>

  update(
    id: string,
    data: UpdateStudentData,
  ): Promise<Student | null>

  updateStatus(
    id: string,
    status: StudentStatus,
    exitDate: string | null,
  ): Promise<Student | null>

  existsByStudentCode(
    studentCode: string,
    excludeId?: string,
  ): Promise<boolean>

  existsByNis(
    nis: string,
    excludeId?: string,
  ): Promise<boolean>

  existsByNisn(
    nisn: string,
    excludeId?: string,
  ): Promise<boolean>
}

export class StudentRepository
  implements StudentRepositoryContract
{
  constructor(
    private readonly executor: StudentDb = db,
  ) {}

  withExecutor(executor: StudentDb): StudentRepository {
    return new StudentRepository(executor)
  }

  async findById(id: string): Promise<Student | null> {
    const rows = await this.executor
      .select()
      .from(students)
      .where(eq(students.id, id))
      .limit(1)

    return rows[0] ?? null
  }

  async findByStudentCode(
    studentCode: string,
  ): Promise<Student | null> {
    const rows = await this.executor
      .select()
      .from(students)
      .where(eq(students.studentCode, studentCode))
      .limit(1)

    return rows[0] ?? null
  }

  async findByNis(nis: string): Promise<Student | null> {
    const rows = await this.executor
      .select()
      .from(students)
      .where(eq(students.nis, nis))
      .limit(1)

    return rows[0] ?? null
  }

  async findByNisn(nisn: string): Promise<Student | null> {
    const rows = await this.executor
      .select()
      .from(students)
      .where(eq(students.nisn, nisn))
      .limit(1)

    return rows[0] ?? null
  }

  async findBillingEligibleByPeriod(
    period: string,
  ): Promise<Student[]> {
    return this.executor
      .select()
      .from(students)
      .where(
        and(
          lte(students.entryDate, period),
          or(
            isNull(students.exitDate),
            gt(students.exitDate, period),
          ),
        ),
      )
      .orderBy(
        asc(students.studentCode),
        asc(students.id),
      )
  }

  async list(
    params: StudentListParams,
  ): Promise<StudentListResult> {
    const {
      page,
      perPage,
      search,
      status,
      sortBy = 'fullName',
      sortDirection = 'asc',
    } = params

    const conditions = []

    if (search?.trim()) {
      const keyword = `%${search.trim()}%`

      conditions.push(
        or(
          ilike(students.studentCode, keyword),
          ilike(students.nis, keyword),
          ilike(students.nisn, keyword),
          ilike(students.fullName, keyword),
        ),
      )
    }

    if (status) {
      conditions.push(eq(students.status, status))
    }

    const whereClause =
      conditions.length > 0
        ? and(...conditions)
        : undefined

    const sortColumn = {
      studentCode: students.studentCode,
      fullName: students.fullName,
      entryDate: students.entryDate,
      status: students.status,
      createdAt: students.createdAt,
    }[sortBy]

    const orderBy =
      sortDirection === 'desc'
        ? desc(sortColumn)
        : asc(sortColumn)

    const offset = (page - 1) * perPage

    const [rows, totalRows] = await Promise.all([
      this.executor
        .select()
        .from(students)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(perPage)
        .offset(offset),

      this.executor
        .select({
          count: count(),
        })
        .from(students)
        .where(whereClause),
    ])

    return {
      data: rows,
      total: Number(totalRows[0]?.count ?? 0),
    }
  }

  async create(
    data: CreateStudentData,
  ): Promise<Student> {
    const rows = await this.executor
      .insert(students)
      .values({
        studentCode: data.studentCode,
        nis: data.nis ?? null,
        nisn: data.nisn ?? null,
        fullName: data.fullName,
        gender: data.gender ?? null,
        birthPlace: data.birthPlace ?? null,
        birthDate: data.birthDate ?? null,
        guardianName: data.guardianName ?? null,
        guardianPhone: data.guardianPhone ?? null,
        entryDate: data.entryDate,
        status: 'ACTIVE',
        exitDate: null,
        notes: data.notes ?? null,
      })
      .returning()

    if (!rows[0]) {
      throw new Error('STUDENT_CREATE_FAILED')
    }

    return rows[0]
  }

  async update(
    id: string,
    data: UpdateStudentData,
  ): Promise<Student | null> {
    const rows = await this.executor
      .update(students)
      .set({
        ...(data.nis !== undefined && {
          nis: data.nis,
        }),
        ...(data.nisn !== undefined && {
          nisn: data.nisn,
        }),
        ...(data.fullName !== undefined && {
          fullName: data.fullName,
        }),
        ...(data.gender !== undefined && {
          gender: data.gender,
        }),
        ...(data.birthPlace !== undefined && {
          birthPlace: data.birthPlace,
        }),
        ...(data.birthDate !== undefined && {
          birthDate: data.birthDate,
        }),
        ...(data.guardianName !== undefined && {
          guardianName: data.guardianName,
        }),
        ...(data.guardianPhone !== undefined && {
          guardianPhone: data.guardianPhone,
        }),
        ...(data.notes !== undefined && {
          notes: data.notes,
        }),
        updatedAt: new Date(),
      })
      .where(eq(students.id, id))
      .returning()

    return rows[0] ?? null
  }

  async updateStatus(
    id: string,
    status: StudentStatus,
    exitDate: string | null,
  ): Promise<Student | null> {
    const rows = await this.executor
      .update(students)
      .set({
        status,
        exitDate,
        updatedAt: new Date(),
      })
      .where(eq(students.id, id))
      .returning()

    return rows[0] ?? null
  }

  async existsByStudentCode(
    studentCode: string,
    excludeId?: string,
  ): Promise<boolean> {
    const conditions = [
      eq(students.studentCode, studentCode),
    ]

    if (excludeId) {
      conditions.push(ne(students.id, excludeId))
    }

    const rows = await this.executor
      .select({ id: students.id })
      .from(students)
      .where(and(...conditions))
      .limit(1)

    return rows.length > 0
  }

  async existsByNis(
    nis: string,
    excludeId?: string,
  ): Promise<boolean> {
    const conditions = [eq(students.nis, nis)]

    if (excludeId) {
      conditions.push(ne(students.id, excludeId))
    }

    const rows = await this.executor
      .select({ id: students.id })
      .from(students)
      .where(and(...conditions))
      .limit(1)

    return rows.length > 0
  }

  async existsByNisn(
    nisn: string,
    excludeId?: string,
  ): Promise<boolean> {
    const conditions = [eq(students.nisn, nisn)]

    if (excludeId) {
      conditions.push(ne(students.id, excludeId))
    }

    const rows = await this.executor
      .select({ id: students.id })
      .from(students)
      .where(and(...conditions))
      .limit(1)

    return rows.length > 0
  }
}
