import {
  StudentClassHistoryRepository,
} from '../repositories/student-class-history.repository.ts'
import type {
  CreateStudentClassHistoryData,
  StudentClassHistory,
} from '../repositories/student-class-history.repository.ts'

type StudentClassHistoryExecutor =
  Parameters<StudentClassHistoryRepository['create']>[1]

export class StudentClassHistoryServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'StudentClassHistoryServiceError'
  }
}

export class StudentClassHistoryService {
  constructor(
    private readonly repository: StudentClassHistoryRepository,
  ) {}

  async getById(id: string): Promise<StudentClassHistory> {
    const history = await this.repository.findById(id)

    if (!history) {
      throw new StudentClassHistoryServiceError(
        'STUDENT_CLASS_HISTORY_NOT_FOUND',
        'Student class history not found',
      )
    }

    return history
  }

  async getActiveByStudentId(
    studentId: string,
  ): Promise<StudentClassHistory> {
    const history = await this.repository.findActiveByStudentId(studentId)

    if (!history) {
      throw new StudentClassHistoryServiceError(
        'STUDENT_CLASS_HISTORY_NOT_FOUND',
        'Active student class history not found',
      )
    }

    return history
  }

  async listByStudentId(
    studentId: string,
  ): Promise<StudentClassHistory[]> {
    return this.repository.listByStudentId(studentId)
  }

  async create(
    data: CreateStudentClassHistoryData,
    executor?: StudentClassHistoryExecutor,
  ): Promise<StudentClassHistory> {
    this.validateDateRange(data.startDate, data.endDate)

    const repository = executor
      ? this.repository.withExecutor(executor)
      : this.repository

    const activeHistory = await repository.findActiveByStudentId(
      data.studentId,
    )

    if (activeHistory) {
      throw new StudentClassHistoryServiceError(
        'STUDENT_CLASS_HISTORY_ALREADY_ACTIVE',
        'Student already has an active class history',
      )
    }

    try {
      return await repository.create(data)
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new StudentClassHistoryServiceError(
          'STUDENT_CLASS_HISTORY_ALREADY_ACTIVE',
          'Student already has an active class history',
        )
      }

      throw error
    }
  }

  async closeActive(
    studentId: string,
    endDate: string,
    executor?: StudentClassHistoryExecutor,
  ): Promise<StudentClassHistory> {
    const repository = executor
      ? this.repository.withExecutor(executor)
      : this.repository

    const activeHistory = await repository.findActiveByStudentId(
      studentId,
    )

    if (!activeHistory) {
      throw new StudentClassHistoryServiceError(
        'STUDENT_CLASS_HISTORY_NOT_FOUND',
        'Active student class history not found',
      )
    }

    this.validateDateRange(activeHistory.startDate, endDate)

    const closedHistory = await repository.closeActive(
      studentId,
      endDate,
    )

    if (!closedHistory) {
      throw new StudentClassHistoryServiceError(
        'STUDENT_CLASS_HISTORY_NOT_FOUND',
        'Active student class history not found',
      )
    }

    return closedHistory
  }

  private validateDateRange(
    startDate: string,
    endDate?: string | null,
  ): void {
    if (endDate !== undefined && endDate !== null && endDate < startDate) {
      throw new StudentClassHistoryServiceError(
        'INVALID_HISTORY_DATE_RANGE',
        'End date cannot be before start date',
      )
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error
    ) {
      return (error as { code?: unknown }).code === '23505'
    }

    return false
  }
}
