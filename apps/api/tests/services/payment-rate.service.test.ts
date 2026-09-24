import { inArray } from 'drizzle-orm'

import { db } from '../../src/db/index.ts'
import { academicYears } from '../../../../database/drizzle/schema/academic-years.ts'
import { paymentTypes } from '../../../../database/drizzle/schema/payment-types.ts'
import { paymentRates } from '../../../../database/drizzle/schema/payment-rates.ts'
import {
  PaymentRateService,
  PaymentRateServiceError,
} from '../../src/services/payment-rate.service.ts'

const service = new PaymentRateService()

const suffix = Date.now()

const academicYearCode = `TEST-SVC-AY-${suffix}`
const paymentTypeCode = `TEST-SVC-PT-${suffix}`

let academicYearId: string | undefined
let paymentTypeId: string | undefined

const paymentRateIds: string[] = []

async function expectServiceError(
  operation: Promise<unknown>,
  expectedCode: string,
): Promise<void> {
  try {
    await operation
    throw new Error(
      `EXPECTED_ERROR_NOT_THROWN:${expectedCode}`,
    )
  } catch (error) {
    if (
      !(
        error instanceof PaymentRateServiceError
      )
    ) {
      throw error
    }

    if (error.code !== expectedCode) {
      throw new Error(
        `EXPECTED:${expectedCode};ACTUAL:${error.code}`,
      )
    }
  }
}

try {
  const academicYearRows = await db
    .insert(academicYears)
    .values({
      code: academicYearCode,
      name: 'Test Service Academic Year',
      startDate: '2030-07-01',
      endDate: '2031-06-30',
      isActive: false,
    })
    .returning()

  const academicYear = academicYearRows[0]

  if (!academicYear) {
    throw new Error(
      'ACADEMIC_YEAR_CREATE_FAILED',
    )
  }

  academicYearId = academicYear.id

  const paymentTypeRows = await db
    .insert(paymentTypes)
    .values({
      code: paymentTypeCode,
      name: 'Test Service Payment Type',
      nature: 'MONTHLY',
      isActive: true,
    })
    .returning()

  const paymentType = paymentTypeRows[0]

  if (!paymentType) {
    throw new Error(
      'PAYMENT_TYPE_CREATE_FAILED',
    )
  }

  paymentTypeId = paymentType.id

  console.log(
    'PASS: create test master data',
  )

  const created = await service.create({
    academicYearId,
    paymentTypeId,
    amount: '150000.00',
  })

  paymentRateIds.push(created.id)

  if (
    created.amount !== '150000.00' ||
    created.isActive !== true
  ) {
    throw new Error(
      'CREATE_FAILED',
    )
  }

  console.log('PASS: create')

  const found =
    await service.getById(created.id)

  if (found.id !== created.id) {
    throw new Error(
      'GET_BY_ID_FAILED',
    )
  }

  console.log('PASS: getById')

  const foundByCombination =
    await service.getByAcademicYearAndPaymentType(
      academicYearId,
      paymentTypeId,
    )

  if (
    !foundByCombination ||
    foundByCombination.id !== created.id
  ) {
    throw new Error(
      'GET_BY_COMBINATION_FAILED',
    )
  }

  console.log(
    'PASS: getByAcademicYearAndPaymentType',
  )

  const list =
    await service.list({
      academicYearId,
      paymentTypeId,
      isActive: true,
      page: 1,
      perPage: 10,
    })

  if (
    list.total !== 1 ||
    list.items.length !== 1 ||
    list.items[0]?.id !== created.id
  ) {
    throw new Error(
      'LIST_FAILED',
    )
  }

  console.log('PASS: list')

  await expectServiceError(
    service.create({
      academicYearId,
      paymentTypeId,
      amount: '175000',
    }),
    'PAYMENT_RATE_ALREADY_EXISTS',
  )

  console.log(
    'PASS: duplicate active rate rejected',
  )

  await expectServiceError(
    service.create({
      academicYearId,
      paymentTypeId,
      amount: '0',
    }),
    'INVALID_PAYMENT_RATE_AMOUNT',
  )

  console.log(
    'PASS: zero amount rejected',
  )

  await expectServiceError(
    service.create({
      academicYearId,
      paymentTypeId,
      amount: '-1000',
    }),
    'INVALID_PAYMENT_RATE_AMOUNT',
  )

  console.log(
    'PASS: negative amount rejected',
  )

  await expectServiceError(
    service.create({
      academicYearId,
      paymentTypeId,
      amount: '150000.123',
    }),
    'INVALID_PAYMENT_RATE_AMOUNT',
  )

  console.log(
    'PASS: more than two decimals rejected',
  )

  await expectServiceError(
    service.create({
      academicYearId:
        '00000000-0000-0000-0000-000000000000',
      paymentTypeId,
      amount: '175000',
    }),
    'ACADEMIC_YEAR_NOT_FOUND',
  )

  console.log(
    'PASS: missing academic year rejected',
  )

  await expectServiceError(
    service.create({
      academicYearId,
      paymentTypeId:
        '00000000-0000-0000-0000-000000000000',
      amount: '175000',
    }),
    'PAYMENT_TYPE_NOT_FOUND',
  )

  console.log(
    'PASS: missing payment type rejected',
  )

  const updated =
    await service.update(
      created.id,
      {
        amount: '175000.00',
      },
    )

  if (
    !updated ||
    updated.amount !== '175000.00'
  ) {
    throw new Error(
      'UPDATE_FAILED',
    )
  }

  console.log('PASS: update')

  const deactivated =
    await service.deactivate(
      created.id,
    )

  if (
    !deactivated ||
    deactivated.isActive !== false
  ) {
    throw new Error(
      'DEACTIVATE_FAILED',
    )
  }

  console.log('PASS: deactivate')

  const inactive =
    await service.getById(
      created.id,
    )

  if (inactive.isActive !== false) {
    throw new Error(
      'INACTIVE_STATE_FAILED',
    )
  }

  console.log(
    'PASS: inactive state',
  )

  const activated =
    await service.activate(
      created.id,
    )

  if (
    !activated ||
    activated.isActive !== true
  ) {
    throw new Error(
      'ACTIVATE_FAILED',
    )
  }

  console.log('PASS: activate')

  await expectServiceError(
    service.getById(
      '00000000-0000-0000-0000-000000000000',
    ),
    'PAYMENT_RATE_NOT_FOUND',
  )

  console.log(
    'PASS: not found',
  )

  console.log(
    'PAYMENT RATE SERVICE TEST: 16/16 PASS',
  )
} finally {
  if (paymentRateIds.length > 0) {
    await db
      .delete(paymentRates)
      .where(
        inArray(
          paymentRates.id,
          paymentRateIds,
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
