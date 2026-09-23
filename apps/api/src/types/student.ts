export const STUDENT_STATUSES = [
  'ACTIVE',
  'TRANSFERRED',
  'GRADUATED',
] as const

export type StudentStatus = (typeof STUDENT_STATUSES)[number]

export interface Student {
  id: string
  studentCode: string
  nis: string | null
  nisn: string | null
  fullName: string
  gender: string | null
  birthPlace: string | null
  birthDate: string | null
  guardianName: string | null
  guardianPhone: string | null
  entryDate: string
  status: StudentStatus
  exitDate: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateStudentData {
  studentCode: string
  nis?: string | null
  nisn?: string | null
  fullName: string
  gender?: string | null
  birthPlace?: string | null
  birthDate?: string | null
  guardianName?: string | null
  guardianPhone?: string | null
  entryDate: string
  notes?: string | null
}

export interface UpdateStudentData {
  nis?: string | null
  nisn?: string | null
  fullName?: string
  gender?: string | null
  birthPlace?: string | null
  birthDate?: string | null
  guardianName?: string | null
  guardianPhone?: string | null
  notes?: string | null
}

export interface TransferStudentData {
  exitDate: string
}

export interface GraduateStudentData {
  exitDate: string
}

export interface ReactivateStudentData {
  academicYearId: string
  classId: string
  startDate: string
}

export type StudentSortField =
  | 'studentCode'
  | 'fullName'
  | 'entryDate'
  | 'status'
  | 'createdAt'

export interface StudentListParams {
  page: number
  perPage: number
  search?: string
  status?: StudentStatus
  sortBy?: StudentSortField
  sortDirection?: 'asc' | 'desc'
}

export interface StudentListResult {
  data: Student[]
  total: number
}
