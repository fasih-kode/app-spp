import { TypeCompiler } from '@sinclair/typebox/compiler'

import {
  CreateMonthlyBillingSchema,
  MonthlyBillingSchema,
} from '../../src/schemas/monthly-billing.schema.ts'

const createMonthlyBilling =
  TypeCompiler.Compile(
    CreateMonthlyBillingSchema,
  )

const monthlyBilling =
  TypeCompiler.Compile(
    MonthlyBillingSchema,
  )

function assert(
  condition: boolean,
  message: string,
) {
  if (!condition) {
    throw new Error(message)
  }
}

assert(
  createMonthlyBilling.Check({
    period: '2026-09-01',
  }),
  'VALID_PERIOD_FAILED',
)

assert(
  createMonthlyBilling.Check({
    period: '2026-09-15',
  }),
  'VALID_DATE_SHAPE_FAILED',
)

assert(
  !createMonthlyBilling.Check({
    period: '2026-13-01',
  }),
  'INVALID_MONTH_MUST_FAIL',
)

assert(
  !createMonthlyBilling.Check({
    period: '2026-9-01',
  }),
  'INVALID_PERIOD_FORMAT_MUST_FAIL',
)

assert(
  !createMonthlyBilling.Check({}),
  'MISSING_PERIOD_MUST_FAIL',
)

const validResponse = {
  period: '2026-09-01',
  academicYearId:
    '550e8400-e29b-41d4-a716-446655440000',
  studentsScanned: 2,
  paymentTypesScanned: 1,
  generated: 1,
  skipped: 1,
  failed: 0,
  items: [
    {
      studentId:
        '550e8400-e29b-41d4-a716-446655440001',
      paymentTypeId:
        '550e8400-e29b-41d4-a716-446655440002',
      status: 'CREATED',
    },
  ],
}

assert(
  monthlyBilling.Check(validResponse),
  'VALID_RESPONSE_FAILED',
)

console.log(
  'PASS: valid billing period',
)

console.log(
  'PASS: valid date shape',
)

console.log(
  'PASS: invalid billing month rejected',
)

console.log(
  'PASS: invalid billing format rejected',
)

console.log(
  'PASS: missing billing period rejected',
)

console.log(
  'PASS: valid monthly billing response',
)

console.log(
  'MONTHLY BILLING DTO SCHEMA TEST: 6/6 PASS',
)
