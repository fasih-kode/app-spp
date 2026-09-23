import { db } from '../db/index.ts'
import {
  StudentRepository,
} from '../repositories/student.repository.ts'
import {
  StudentClassHistoryService,
} from './student-class-history.service.ts'
import type {
  CreateStudentData,
  GraduateStudentData,
  ReactivateStudentData,
  Student,
  StudentListParams,
  StudentListResult,
  TransferStudentData,
  UpdateStudentData,
} from '../types/student.ts'

export class StudentServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'StudentServiceError'
  }
}

export class StudentService {
  constructor(
    private readonly repository: StudentRepository,
    private readonly classHistory: StudentClassHistoryService,
  ) {}

  async getById(id: string): Promise<Student> {
    const student = await this.repository.findById(id)

    if (!student) {
      throw new StudentServiceError(
        'STUDENT_NOT_FOUND',
        'Student not found',
      )
    }

    return student
  }

  async getByStudentCode(
    studentCode: string,
  ): Promise<Student> {
    const student =
      await this.repository.findByStudentCode(studentCode)

    if (!student) {
      throw new StudentServiceError(
        'STUDENT_NOT_FOUND',
        'Student not found',
      )
    }

    return student
  }

  async list(
    params: StudentListParams,
  ): Promise<StudentListResult> {
    return this.repository.list(params)
  }

  async create(
    data: CreateStudentData,
  ): Promise<Student> {
    await this.ensureUnique(
      data.studentCode,
      data.nis,
      data.nisn,
    )

    return this.repository.create(data)
  }

  async update(
    id: string,
    data: UpdateStudentData,
  ): Promise<Student> {
    const student = await this.getById(id)

    if (
      data.nis !== undefined &&
      data.nis !== null
    ) {
      const exists = await this.repository.existsByNis(
        data.nis,
        id,
      )

      if (exists) {
        throw new StudentServiceError(
          'STUDENT_NIS_ALREADY_EXISTS',
          'NIS already exists',
        )
      }
    }

    if (
      data.nisn !== undefined &&
      data.nisn !== null
    ) {
      const exists = await this.repository.existsByNisn(
        data.nisn,
        id,
      )

      if (exists) {
        throw new StudentServiceError(
          'STUDENT_NISN_ALREADY_EXISTS',
          'NISN already exists',
        )
      }
    }

    const updated = await this.repository.update(
      student.id,
      data,
    )

    if (!updated) {
      throw new StudentServiceError(
        'STUDENT_NOT_FOUND',
        'Student not found',
      )
    }

    return updated
  }

  async transfer(
    id: string,
    data: TransferStudentData,
  ): Promise<Student> {
    const student = await this.getById(id)

    if (student.status !== 'ACTIVE') {
      throw new StudentServiceError(
        'INVALID_STUDENT_STATUS_TRANSITION',
        'Only ACTIVE students can be transferred',
      )
    }

    this.validateExitDate(
      student.entryDate,
      data.exitDate,
    )

    return db.transaction(async (tx) => {
      const repository =
        this.repository.withExecutor(tx as never)

      const current =
        await repository.findById(id)

      if (!current) {
        throw new StudentServiceError(
          'STUDENT_NOT_FOUND',
          'Student not found',
        )
      }

      if (current.status !== 'ACTIVE') {
        throw new StudentServiceError(
          'INVALID_STUDENT_STATUS_TRANSITION',
          'Only ACTIVE students can be transferred',
        )
      }

      await this.classHistory.closeActive(
        id,
        data.exitDate,
        tx,
      )

      const updated = await repository.updateStatus(
        id,
        'TRANSFERRED',
        data.exitDate,
      )

      if (!updated) {
        throw new StudentServiceError(
          'STUDENT_NOT_FOUND',
          'Student not found',
        )
      }

      return updated
    })
  }

  async graduate(
    id: string,
    data: GraduateStudentData,
  ): Promise<Student> {
    const student = await this.getById(id)

    if (student.status !== 'ACTIVE') {
      throw new StudentServiceError(
        'INVALID_STUDENT_STATUS_TRANSITION',
        'Only ACTIVE students can be graduated',
      )
    }

    this.validateExitDate(
      student.entryDate,
      data.exitDate,
    )

    return db.transaction(async (tx) => {
      const repository =
        this.repository.withExecutor(tx as never)

      const current =
        await repository.findById(id)

      if (!current) {
        throw new StudentServiceError(
          'STUDENT_NOT_FOUND',
          'Student not found',
        )
      }

      if (current.status !== 'ACTIVE') {
        throw new StudentServiceError(
          'INVALID_STUDENT_STATUS_TRANSITION',
          'Only ACTIVE students can be graduated',
        )
      }

      await this.classHistory.closeActive(
        id,
        data.exitDate,
        tx,
      )

      const updated = await repository.updateStatus(
        id,
        'GRADUATED',
        data.exitDate,
      )

      if (!updated) {
        throw new StudentServiceError(
          'STUDENT_NOT_FOUND',
          'Student not found',
        )
      }

      return updated
    })
  }

  async reactivate(
    id: string,
    data: ReactivateStudentData,
  ): Promise<Student> {
    const student = await this.getById(id)

    if (student.status !== 'TRANSFERRED') {
      throw new StudentServiceError(
        'INVALID_STUDENT_STATUS_TRANSITION',
        'Only TRANSFERRED students can be reactivated',
      )
    }

    return db.transaction(async (tx) => {
      const repository =
        this.repository.withExecutor(tx as never)

      const current =
        await repository.findById(id)

      if (!current) {
        throw new StudentServiceError(
          'STUDENT_NOT_FOUND',
          'Student not found',
        )
      }

      if (current.status !== 'TRANSFERRED') {
        throw new StudentServiceError(
          'INVALID_STUDENT_STATUS_TRANSITION',
          'Only TRANSFERRED students can be reactivated',
        )
      }

      await this.classHistory.create(
        {
          studentId: id,
          academicYearId: data.academicYearId,
          classId: data.classId,
          startDate: data.startDate,
        },
        tx,
      )

      const updated = await repository.updateStatus(
        id,
        'ACTIVE',
        null,
      )

      if (!updated) {
        throw new StudentServiceError(
          'STUDENT_NOT_FOUND',
          'Student not found',
        )
      }

      return updated
    })
  }

  private async ensureUnique(
    studentCode: string,
    nis?: string | null,
    nisn?: string | null,
  ): Promise<void> {
    if (
      await this.repository.existsByStudentCode(
        studentCode,
      )
    ) {
      throw new StudentServiceError(
        'STUDENT_CODE_ALREADY_EXISTS',
        'Student code already exists',
      )
    }

    if (
      nis !== undefined &&
      nis !== null &&
      await this.repository.existsByNis(nis)
    ) {
      throw new StudentServiceError(
        'STUDENT_NIS_ALREADY_EXISTS',
        'NIS already exists',
      )
    }

    if (
      nisn !== undefined &&
      nisn !== null &&
      await this.repository.existsByNisn(nisn)
    ) {
      throw new StudentServiceError(
        'STUDENT_NISN_ALREADY_EXISTS',
        'NISN already exists',
      )
    }
  }

  private validateExitDate(
    entryDate: string,
    exitDate: string,
  ): void {
    if (exitDate < entryDate) {
      throw new StudentServiceError(
        'INVALID_EXIT_DATE',
        'Exit date cannot be before entry date',
      )
    }
  }
}
