import { inArray } from 'drizzle-orm'

import { db } from '../../src/db/index.ts'
import { academicYears } from '../../../../database/drizzle/schema/academic-years.ts'
import {
  AcademicYearRepository,
} from '../../src/repositories/academic-year.repository.ts'

const repository = new AcademicYearRepository()

const code = `TEST-AY-REPO-${Date.now()}`

let academicYearId: string | undefined
let activeAcademicYearId: string | undefined

try {
  const inactiveRows = await db
    .insert(academicYears)
    .values({
      code,
      name: 'Test Academic Year Repository',
      startDate: '2026-07-01',
      endDate: '2027-06-30',
      isActive: false,
    })
    .returning()

  const inactiveAcademicYear = inactiveRows[0]

  if (!inactiveAcademicYear) {
    throw new Error(
      'ACADEMIC_YEAR_CREATE_FAILED',
    )
  }

  academicYearId = inactiveAcademicYear.id

  console.log('PASS: create inactive academic year')

  const activeRows = await db
    .insert(academicYears)
    .values({
      code: `${code}-ACTIVE`,
      name: 'Test Active Academic Year Repository',
      startDate: '2027-07-01',
      endDate: '2028-06-30',
      isActive: true,
    })
    .returning()

  const activeAcademicYear = activeRows[0]

  if (!activeAcademicYear) {
    throw new Error(
      'ACTIVE_ACADEMIC_YEAR_CREATE_FAILED',
    )
  }

  activeAcademicYearId = activeAcademicYear.id

  console.log('PASS: create active academic year')

  const found = await repository.findById(
    academicYearId,
  )

  if (
    !found ||
    found.id !== academicYearId ||
    found.code !== code
  ) {
    throw new Error('FIND_BY_ID_FAILED')
  }

  console.log('PASS: findById')

  const notFound =
    await repository.findById(
      '00000000-0000-0000-0000-000000000000',
    )

  if (notFound !== null) {
    throw new Error(
      'FIND_BY_ID_NOT_FOUND_FAILED',
    )
  }

  console.log('PASS: findById not found')

  const all = await repository.list({
    page: 1,
    perPage: 100,
  })

  if (
    all.total < 2 ||
    !all.items.some(
      (item) => item.id === academicYearId,
    ) ||
    !all.items.some(
      (item) => item.id === activeAcademicYearId,
    )
  ) {
    throw new Error('LIST_ALL_FAILED')
  }

  console.log('PASS: list all')

  const activeList =
    await repository.list({
      isActive: true,
      page: 1,
      perPage: 100,
    })

  if (
    activeList.total < 1 ||
    !activeList.items.some(
      (item) =>
        item.id === activeAcademicYearId &&
        item.isActive === true,
    )
  ) {
    throw new Error('LIST_ACTIVE_FAILED')
  }

  console.log('PASS: list active')

  const inactiveList =
    await repository.list({
      isActive: false,
      page: 1,
      perPage: 100,
    })

  if (
    inactiveList.total < 1 ||
    !inactiveList.items.some(
      (item) =>
        item.id === academicYearId &&
        item.isActive === false,
    )
  ) {
    throw new Error('LIST_INACTIVE_FAILED')
  }

  console.log('PASS: list inactive')

  const paged =
    await repository.list({
      page: 1,
      perPage: 1,
    })

  if (
    paged.items.length !== 1 ||
    paged.total < 2
  ) {
    throw new Error('PAGINATION_FAILED')
  }

  console.log('PASS: pagination')

  console.log(
    'ACADEMIC YEAR REPOSITORY TEST: 7/7 PASS',
  )
} finally {
  const ids = [
    academicYearId,
    activeAcademicYearId,
  ].filter(
    (id): id is string => !!id,
  )

  if (ids.length > 0) {
    await db
      .delete(academicYears)
      .where(
        inArray(
          academicYears.id,
          ids,
        ),
      )
  }

  console.log('DATABASE CLEANUP: OK')
}
