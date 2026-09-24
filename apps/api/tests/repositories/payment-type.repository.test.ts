import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../../src/db/index.ts'
import { paymentTypes } from '../../../../database/drizzle/schema/payment-types.ts'
import {
  PaymentTypeRepository,
} from '../../src/repositories/payment-type.repository.ts'

const repository = new PaymentTypeRepository()

const testCodes = [
  'TEST_SPP_REPOSITORY',
  'TEST_UJIAN_REPOSITORY',
]

try {
  await db
    .delete(paymentTypes)
    .where(
      inArray(paymentTypes.code, testCodes),
    )

  const created = await repository.create({
    code: 'TEST_SPP_REPOSITORY',
    name: 'Test SPP Repository',
    nature: 'BULANAN',
    notes: 'Repository test',
  })

  if (created.code !== 'TEST_SPP_REPOSITORY') {
    throw new Error('CREATE_FAILED')
  }

  console.log('PASS: create')

  const foundById = await repository.findById(created.id)

  if (!foundById || foundById.id !== created.id) {
    throw new Error('FIND_BY_ID_FAILED')
  }

  console.log('PASS: findById')

  const foundByCode = await repository.findByCode(
    'TEST_SPP_REPOSITORY',
  )

  if (!foundByCode || foundByCode.id !== created.id) {
    throw new Error('FIND_BY_CODE_FAILED')
  }

  console.log('PASS: findByCode')

  await repository.create({
    code: 'TEST_UJIAN_REPOSITORY',
    name: 'Test Ujian Repository',
    nature: 'SEKALI',
  })

  const listed = await repository.list({
    search: 'Test',
    page: 1,
    perPage: 10,
  })

  if (listed.total < 2 || listed.items.length < 2) {
    throw new Error('LIST_FAILED')
  }

  console.log('PASS: list + search')

  const activeList = await repository.list({
    isActive: true,
    page: 1,
    perPage: 10,
  })

  if (
    !activeList.items.some(
      (item) => item.id === created.id,
    )
  ) {
    throw new Error('ACTIVE_FILTER_FAILED')
  }

  console.log('PASS: isActive filter')

  const updated = await repository.update(
    created.id,
    {
      name: 'Test SPP Repository Updated',
      notes: 'Updated',
    },
  )

  if (
    !updated ||
    updated.name !== 'Test SPP Repository Updated'
  ) {
    throw new Error('UPDATE_FAILED')
  }

  console.log('PASS: update')

  const deactivated = await repository.setActive(
    created.id,
    false,
  )

  if (!deactivated || deactivated.isActive !== false) {
    throw new Error('SET_ACTIVE_FAILED')
  }

  console.log('PASS: setActive false')

  const inactiveList = await repository.list({
    isActive: false,
    page: 1,
    perPage: 10,
  })

  if (
    !inactiveList.items.some(
      (item) => item.id === created.id,
    )
  ) {
    throw new Error('INACTIVE_FILTER_FAILED')
  }

  console.log('PASS: inactive filter')

  console.log('PAYMENT TYPE REPOSITORY TEST: 9/9 PASS')
} finally {
  await db
    .delete(paymentTypes)
    .where(
      inArray(paymentTypes.code, testCodes),
    )

  console.log('DATABASE CLEANUP: OK')
}
