import {
  and,
  asc,
  desc,
  eq,
  isNull,
} from 'drizzle-orm'
import type { PgDatabase } from 'drizzle-orm/pg-core'
import { db } from '../db/index.ts'
import {
  studentClassHistories,
} from '../../../../database/drizzle/schema/student-class-histories.ts'

export interface StudentClassHistory {
  id: string
  studentId: string
  academicYearId: string
  classId: string
  startDate: string
  endDate: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateStudentClassHistoryData {
  studentId: string
  academicYearId: string
  classId: string
  startDate: string
  endDate?: string | null
}

type StudentClassHistoryDb =
  PgDatabase<any, any, any>

export interface StudentClassHistoryRepositoryContract {
  findById(
    id: string,
  ): Promise<StudentClassHistory | null>

  findActiveByStudentId(
    studentId: string,
  ): Promise<StudentClassHistory | null>

  listByStudentId(
    studentId: string,
  ): Promise<StudentClassHistory[]>

  create(
    data: CreateStudentClassHistoryData,
    executor?: StudentClassHistoryDb,
  ): Promise<StudentClassHistory>

  closeActive(
    studentId: string,
    endDate: string,
    executor?: StudentClassHistoryDb,
  ): Promise<StudentClassHistory | null>
}

export class StudentClassHistoryRepository
  implements StudentClassHistoryRepositoryContract
{
  constructor(
    private readonly executor: StudentClassHistoryDb = db,
  ) {}

  withExecutor(
    executor: StudentClassHistoryDb,
  ): StudentClassHistoryRepository {
    return new StudentClassHistoryRepository(
      executor,
    )
  }

  async findById(
    id: string,
  ): Promise<StudentClassHistory | null> {
    const rows = await this.executor
      .select()
      .from(studentClassHistories)
      .where(
        eq(studentClassHistories.id, id),
      )
      .limit(1)

    return rows[0] ?? null
  }

  async findActiveByStudentId(
    studentId: string,
  ): Promise<StudentClassHistory | null> {
    const rows = await this.executor
      .select()
      .from(studentClassHistories)
      .where(
        and(
          eq(
            studentClassHistories.studentId,
            studentId,
          ),
          isNull(
            studentClassHistories.endDate,
          ),
        ),
      )
      .limit(1)

    return rows[0] ?? null
  }

  async listByStudentId(
    studentId: string,
  ): Promise<StudentClassHistory[]> {
    return this.executor
      .select()
      .from(studentClassHistories)
      .where(
        eq(
          studentClassHistories.studentId,
          studentId,
        ),
      )
      .orderBy(
        desc(studentClassHistories.startDate),
        asc(studentClassHistories.createdAt),
      )
  }

  async create(
    data: CreateStudentClassHistoryData,
    executor?: StudentClassHistoryDb,
  ): Promise<StudentClassHistory> {
    const database =
      executor ?? this.executor

    const rows = await database
      .insert(studentClassHistories)
      .values({
        studentId: data.studentId,
        academicYearId: data.academicYearId,
        classId: data.classId,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
      })
      .returning()

    if (!rows[0]) {
      throw new Error(
        'STUDENT_CLASS_HISTORY_CREATE_FAILED',
      )
    }

    return rows[0]
  }

  async closeActive(
    studentId: string,
    endDate: string,
    executor?: StudentClassHistoryDb,
  ): Promise<StudentClassHistory | null> {
    const database =
      executor ?? this.executor

    const rows = await database
      .update(studentClassHistories)
      .set({
        endDate,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(
            studentClassHistories.studentId,
            studentId,
          ),
          isNull(
            studentClassHistories.endDate,
          ),
        ),
      )
      .returning()

    return rows[0] ?? null
  }
}
