import { describe, expect, test } from 'bun:test'

import { createApp } from '../../src/app.ts'
import { monthlyBillingRoutes } from '../../src/routes/monthly-billing.routes.ts'
import { MonthlyBillingServiceError } from '../../src/services/monthly-billing.service.ts'

const ids = {
  studentA: '550e8400-e29b-41d4-a716-446655440000',
  studentB: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
  paymentTypeMonthly:
    '7ba7b810-9dad-41d1-80b4-00c04fd430c8',
  paymentTypeOther:
    '8ba7b810-9dad-41d1-80b4-00c04fd430c8',
}

const invoice = {
  id: '9ba7b810-9dad-41d4-a716-446655440000',
  invoiceCode: 'INV-202609-AB12CD34',
  studentId: ids.studentA,
  academicYearId:
    'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  classId:
    'b1c2d3e4-f5a6-4789-b012-3456789abcde',
  paymentTypeId: ids.paymentTypeMonthly,
  period: '2026-09-01',
  dueDate: '2026-09-10',
  nominal: '150000.00',
  discount: '0.00',
  payable: '150000.00',
  status: 'UNPAID' as const,
  discountReason: null,
  notes: 'Monthly billing',
  cancelledAt: null,
  cancelledReason: null,
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  updatedAt: new Date('2026-09-01T00:00:00.000Z'),
}

function createResult() {
  return {
    period: '2026-09-01',
    academicYearId:
      'a1b2c3d4-e5f6-4789-a012-3456789abcde',
    studentsScanned: 2,
    paymentTypesScanned: 2,
    generated: 1,
    skipped: 1,
    failed: 1,
    items: [
      {
        studentId: ids.studentA,
        paymentTypeId: ids.paymentTypeMonthly,
        status: 'CREATED' as const,
        invoice,
      },
      {
        studentId: ids.studentB,
        paymentTypeId: ids.paymentTypeMonthly,
        status: 'SKIPPED' as const,
        invoice,
      },
      {
        studentId: ids.studentB,
        paymentTypeId: ids.paymentTypeOther,
        status: 'FAILED' as const,
        errorCode: 'RATE_NOT_FOUND',
        message: 'Payment rate not found',
      },
    ],
  }
}

function request(period: string) {
  return new Request(
    'http://localhost/api/monthly-billing',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        period,
      }),
    },
  )
}

describe('Monthly Billing API routes', () => {
  test('POST /api/monthly-billing returns 200 and mapped result', async () => {
    let receivedPeriod: string | undefined

    const service = {
      generate: async (period: string) => {
        receivedPeriod = period
        return createResult()
      },
    }

    const app = monthlyBillingRoutes(service)

    const response = await app.handle(
      request('2026-09-01'),
    )

    expect(response.status).toBe(200)
    expect(receivedPeriod).toBe('2026-09-01')

    const body = await response.json()

    expect(body.data.period).toBe('2026-09-01')
    expect(body.data.academicYearId).toBe(
      'a1b2c3d4-e5f6-4789-a012-3456789abcde',
    )
    expect(body.data.studentsScanned).toBe(2)
    expect(body.data.paymentTypesScanned).toBe(2)
    expect(body.data.generated).toBe(1)
    expect(body.data.skipped).toBe(1)
    expect(body.data.failed).toBe(1)

    expect(body.data.items[0]).toMatchObject({
      studentId: ids.studentA,
      paymentTypeId:
        ids.paymentTypeMonthly,
      status: 'CREATED',
    })

    expect(body.data.items[0].invoice).toMatchObject({
      id: invoice.id,
      invoiceCode:
        invoice.invoiceCode,
      nominal: '150000.00',
      payable: '150000.00',
      status: 'UNPAID',
    })

    expect(body.data.items[1]).toMatchObject({
      studentId: ids.studentB,
      paymentTypeId:
        ids.paymentTypeMonthly,
      status: 'SKIPPED',
    })

    expect(body.data.items[2]).toEqual({
      studentId: ids.studentB,
      paymentTypeId:
        ids.paymentTypeOther,
      status: 'FAILED',
      errorCode: 'RATE_NOT_FOUND',
      message: 'Payment rate not found',
    })
  })

  test('service receives the exact requested period', async () => {
    let receivedPeriod: string | undefined

    const service = {
      generate: async (period: string) => {
        receivedPeriod = period
        return createResult()
      },
    }

    const app = monthlyBillingRoutes(service)

    const response = await app.handle(
      request('2026-10-01'),
    )

    expect(response.status).toBe(200)
    expect(receivedPeriod).toBe('2026-10-01')
  })

  test('accepts a valid date shape that is not the first day', async () => {
    let receivedPeriod: string | undefined

    const service = {
      generate: async (period: string) => {
        receivedPeriod = period
        return {
          ...createResult(),
          period,
        }
      },
    }

    const app = monthlyBillingRoutes(service)

    const response = await app.handle(
      request('2026-09-15'),
    )

    expect(response.status).toBe(200)
    expect(receivedPeriod).toBe('2026-09-15')
  })

  test('rejects invalid request shape', async () => {
    const service = {
      generate: async () => createResult(),
    }

    const app = monthlyBillingRoutes(service)

    const response = await app.handle(
      new Request(
        'http://localhost/api/monthly-billing',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            period: '2026/09/01',
          }),
        },
      ),
    )

    expect(response.status).toBe(422)
  })

  test('maps INVALID_BILLING_PERIOD to 422', async () => {
    const service = {
      generate: async () => {
        throw new MonthlyBillingServiceError(
          'INVALID_BILLING_PERIOD',
          'Billing period must be the first day of a month',
        )
      },
    }

    const app = createApp(
      undefined,
      service,
    )

    const response = await app.handle(
      request('2026-09-01'),
    )

    expect(response.status).toBe(422)

    expect(await response.json()).toEqual({
      error: {
        code: 'INVALID_BILLING_PERIOD',
        message:
          'Billing period must be the first day of a month',
        details: null,
      },
    })
  })

  test('maps ACADEMIC_YEAR_NOT_FOUND_FOR_PERIOD to 422', async () => {
    const service = {
      generate: async () => {
        throw new MonthlyBillingServiceError(
          'ACADEMIC_YEAR_NOT_FOUND_FOR_PERIOD',
          'Academic year not found for billing period',
        )
      },
    }

    const app = createApp(
      undefined,
      service,
    )

    const response = await app.handle(
      request('2026-09-01'),
    )

    expect(response.status).toBe(422)

    expect(await response.json()).toEqual({
      error: {
        code:
          'ACADEMIC_YEAR_NOT_FOUND_FOR_PERIOD',
        message:
          'Academic year not found for billing period',
        details: null,
      },
    })
  })

  test('keeps item-level FAILED result inside HTTP 200 response', async () => {
    const service = {
      generate: async () => createResult(),
    }

    const app = monthlyBillingRoutes(service)

    const response = await app.handle(
      request('2026-09-01'),
    )

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data.failed).toBe(1)

    expect(body.data.items[2]).toEqual({
      studentId: ids.studentB,
      paymentTypeId:
        ids.paymentTypeOther,
      status: 'FAILED',
      errorCode: 'RATE_NOT_FOUND',
      message: 'Payment rate not found',
    })
  })

  test('returns 500 for unexpected service error', async () => {
    const service = {
      generate: async () => {
        throw new Error(
          'internal monthly billing failure',
        )
      },
    }

    const app = createApp(
      undefined,
      service,
    )

    const response = await app.handle(
      request('2026-09-01'),
    )

    expect(response.status).toBe(500)

    const body = await response.json()

    expect(body).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null,
      },
    })

    expect(
      JSON.stringify(body),
    ).not.toContain(
      'internal monthly billing failure',
    )
  })
})
