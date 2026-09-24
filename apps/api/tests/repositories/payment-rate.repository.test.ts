import { inArray } from 'drizzle-orm'

import { db } from '../../src/db/index.ts'
import { paymentRates } from '../../../../database/drizzle/schema/payment-rates.ts'
import { paymentTypes } from '../../../../database/drizzle/schema/payment-types.ts'
import { academicYears } from '../../../../database/drizzle/schema/academic-years.ts'
import {
  PaymentRateRepository,
} from '../../src/repositories/payment-rate.repository.ts'

const repository = new PaymentRateRepository()

const academicYearCode = `TEST-RATE-REPO-${Date.now()}`
const paymentTypeCode = `TEST-RATE-REPO-${Date.now()}`

let academicYearId: string | undefined
let paymentTypeId: string | undefined

try {
  const academicYearRows = await db
    .insert(academicYears)
    .values({
      code: academicYearCode,
      name: 'Test Rate Repository',
      startDate: '2026-07-01',
      endDate: '2027-06-30',
      isActive: false,
    })
    .returning()

  const academicYear = academicYearRows[0]

  if (!academicYear) {
    throw new Error('ACADEMIC_YEAR_CREATE_FAILED')
  }

  academicYearId = academicYear.id

  const paymentTypeRows = await db
    .insert(paymentTypes)
    .values({
      code: paymentTypeCode,
      name: 'Test Rate Repository',
      nature: 'BULANAN',
    })
    .returning()

  const paymentType = paymentTypeRows[0]

  if (!paymentType) {
    throw new Error('PAYMENT_TYPE_CREATE_FAILED')
  }

  paymentTypeId = paymentType.id

  const created = await repository.create({
    academicYearId,
    paymentTypeId,
    amount: '150000.00',
  })

  if (
    created.academicYearId !== academicYearId ||
    created.paymentTypeId !== paymentTypeId ||
    created.amount !== '150000.00' ||
    created.isActive !== true
  ) {
    throw new Error('CREATE_FAILED')
  }

  console.log('PASS: create')

  const foundById = await repository.findById(created.id)

  if (!foundById || foundById.id !== created.id) {
    throw new Error('FIND_BY_ID_FAILED')
  }

  console.log('PASS: findById')

  const foundActive =
    await repository.findByAcademicYearAndPaymentType(
      academicYearId,
      paymentTypeId,
    )

  if (!foundActive || foundActive.id !== created.id) {
    throw new Error(
      'FIND_BY_ACADEMIC_YEAR_AND_PAYMENT_TYPE_FAILED',
    )
  }

  console.log(
    'PASS: findByAcademicYearAndPaymentType active',
  )

  const activeList = await repository.list({
    academicYearId,
    paymentTypeId,
    isActive: true,
    page: 1,
    perPage: 10,
  })

  if (
    activeList.total !== 1 ||
    activeList.items[0]?.id !== created.id
  ) {
    throw new Error('LIST_FILTER_FAILED')
  }

  console.log('PASS: list filters')

  const updated = await repository.update(
    created.id,
    {
      amount: '175000.00',
    },
  )

  if (
    !updated ||
    updated.amount !== '175000.00'
  ) {
    throw new Error('UPDATE_FAILED')
  }

  console.log('PASS: update')

  const deactivated = await repository.setActive(
    created.id,
    false,
  )

  if (
    !deactivated ||
    deactivated.isActive !== false
  ) {
    throw new Error('SET_ACTIVE_FALSE_FAILED')
  }

  console.log('PASS: setActive false')

  const inactiveList = await repository.list({
    academicYearId,
    paymentTypeId,
    isActive: false,
    page: 1,
    perPage: 10,
  })

  if (
    inactiveList.total !== 1 ||
    inactiveList.items[0]?.id !== created.id
  ) {
    throw new Error('INACTIVE_FILTER_FAILED')
  }

  console.log('PASS: inactive filter')

  const inactiveLookup =
    await repository.findByAcademicYearAndPaymentType(
      academicYearId,
      paymentTypeId,
      false,
    )

  if (
    !inactiveLookup ||
    inactiveLookup.id !== created.id
  ) {
    throw new Error('INACTIVE_LOOKUP_FAILED')
  }

  console.log(
    'PASS: findByAcademicYearAndPaymentType inactive',
  )

  console.log(
    'PAYMENT RATE REPOSITORY TEST: 8/8 PASS',
  )
} finally {
  if (academicYearId) {
    await db
      .delete(paymentRates)
      .where(
        inArray(
          paymentRates.academicYearId,
          [academicYearId],
        ),
      )
  }

  if (paymentTypeId) {
    await db
      .delete(paymentTypes)
      .where(
        inArray(
          paymentTypes.id,
          [paymentTypeId],
        ),
      )
  }

  if (academicYearId) {
    await db
      .delete(academicYears)
      .where(
        inArray(
          academicYears.id,
          [academicYearId],
        ),
      )
  }

  console.log('DATABASE CLEANUP: OK')
}
