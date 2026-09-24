import { inArray } from 'drizzle-orm'

import { db } from '../../src/db/index.ts'
import {
  PaymentTypeRepository,
} from '../../src/repositories/payment-type.repository.ts'
import {
  PaymentTypeService,
  PaymentTypeServiceError,
} from '../../src/services/payment-type.service.ts'
import { paymentTypes } from '../../../../database/drizzle/schema/payment-types.ts'

const repository = new PaymentTypeRepository()
const service = new PaymentTypeService(repository)

const testCodes = [
  'TEST_SERVICE_SPP',
  'TEST_SERVICE_SPP_UPDATED',
  'TEST_SERVICE_UJIAN',
]

try {
  await db
    .delete(paymentTypes)
    .where(inArray(paymentTypes.code, testCodes))

  const created = await service.create({
    code: ' test_service_spp ',
    name: 'Test Service SPP',
    nature: 'BULANAN',
  })

  if (created.code !== 'TEST_SERVICE_SPP') {
    throw new Error('CREATE_NORMALIZATION_FAILED')
  }

  console.log('PASS: create + code normalization')

  const foundById = await service.getById(created.id)

  if (foundById.id !== created.id) {
    throw new Error('GET_BY_ID_FAILED')
  }

  console.log('PASS: getById')

  const foundByCode = await service.getByCode(
    ' test_service_spp ',
  )

  if (foundByCode.id !== created.id) {
    throw new Error('GET_BY_CODE_NORMALIZATION_FAILED')
  }

  console.log('PASS: getByCode + normalization')

  let duplicateRejected = false

  try {
    await service.create({
      code: 'TEST_SERVICE_SPP',
      name: 'Duplicate',
      nature: 'SEKALI',
    })
  } catch (error) {
    duplicateRejected =
      error instanceof PaymentTypeServiceError &&
      error.code === 'PAYMENT_TYPE_CODE_ALREADY_EXISTS'
  }

  if (!duplicateRejected) {
    throw new Error('DUPLICATE_CODE_NOT_REJECTED')
  }

  console.log('PASS: duplicate code rejected')

  let invalidNameRejected = false

  try {
    await service.create({
      code: 'TEST_SERVICE_UJIAN',
      name: '   ',
      nature: 'SEKALI',
    })
  } catch (error) {
    invalidNameRejected =
      error instanceof PaymentTypeServiceError &&
      error.code === 'PAYMENT_TYPE_INVALID_NAME'
  }

  if (!invalidNameRejected) {
    throw new Error('INVALID_NAME_NOT_REJECTED')
  }

  console.log('PASS: empty name rejected')

  let invalidNatureRejected = false

  try {
    await service.create({
      code: 'TEST_SERVICE_UJIAN',
      name: 'Test Ujian',
      nature: '   ',
    })
  } catch (error) {
    invalidNatureRejected =
      error instanceof PaymentTypeServiceError &&
      error.code === 'PAYMENT_TYPE_INVALID_NATURE'
  }

  if (!invalidNatureRejected) {
    throw new Error('INVALID_NATURE_NOT_REJECTED')
  }

  console.log('PASS: empty nature rejected')

  const updated = await service.update(
    created.id,
    {
      code: ' test_service_spp_updated ',
      name: 'Test Service SPP Updated',
      notes: 'Updated by service test',
    },
  )

  if (
    updated.code !== 'TEST_SERVICE_SPP_UPDATED' ||
    updated.name !== 'Test Service SPP Updated'
  ) {
    throw new Error('UPDATE_FAILED')
  }

  console.log('PASS: update + code normalization')

  const deactivated = await service.deactivate(
    created.id,
  )

  if (deactivated.isActive !== false) {
    throw new Error('DEACTIVATE_FAILED')
  }

  console.log('PASS: deactivate')

  const activated = await service.activate(
    created.id,
  )

  if (activated.isActive !== true) {
    throw new Error('ACTIVATE_FAILED')
  }

  console.log('PASS: activate')

  let notFoundRejected = false

  try {
    await service.getById(
      '00000000-0000-0000-0000-000000000000',
    )
  } catch (error) {
    notFoundRejected =
      error instanceof PaymentTypeServiceError &&
      error.code === 'PAYMENT_TYPE_NOT_FOUND'
  }

  if (!notFoundRejected) {
    throw new Error('NOT_FOUND_NOT_REJECTED')
  }

  console.log('PASS: not found error')

  console.log(
    'PAYMENT TYPE SERVICE TEST: 10/10 PASS',
  )
} finally {
  await db
    .delete(paymentTypes)
    .where(inArray(paymentTypes.code, testCodes))

  console.log('DATABASE CLEANUP: OK')
}
