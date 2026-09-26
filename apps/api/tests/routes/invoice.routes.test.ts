import { describe, expect, test } from 'bun:test'

import { createApp } from '../../src/app.ts'
import { invoiceRoutes } from '../../src/routes/invoice.routes.ts'
import type { Invoice } from '../../src/repositories/invoice.repository.ts'
import { InvoiceServiceError } from '../../src/services/invoice.service.ts'

const invoice: Invoice = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  invoiceCode: 'INV-202609-000001',
  studentId: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
  academicYearId: '7ba7b810-9dad-41d1-80b4-00c04fd430c8',
  classId: '8ba7b810-9dad-41d1-80b4-00c04fd430c8',
  paymentTypeId: '9ba7b810-9dad-41d1-80b4-00c04fd430c8',
  period: '2026-09-01',
  dueDate: '2026-09-10',
  nominal: '150000.00',
  discount: '10000.00',
  payable: '140000.00',
  status: 'UNPAID',
  discountReason: 'Beasiswa',
  notes: 'Test invoice',
  cancelledAt: null,
  cancelledReason: null,
  createdAt: new Date('2026-09-25T10:00:00.000Z'),
  updatedAt: new Date('2026-09-25T10:00:00.000Z'),
}

describe('Invoice API routes', () => {
  test('GET /api/invoices returns invoice list', async () => {
    const service = {
      list: async () => ({
        data: [invoice],
        total: 1,
      }),
      getById: async () => invoice,
      create: async () => invoice,
    }

    const app = invoiceRoutes(service)

    const response = await app.handle(
      new Request('http://localhost/api/invoices'),
    )

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).toHaveLength(1)
    expect(body.data[0].invoiceCode).toBe('INV-202609-000001')
    expect(body.meta.page).toBe(1)
    expect(body.meta.perPage).toBe(20)
    expect(body.meta.total).toBe(1)
    expect(body.meta.totalPages).toBe(1)
  })

  test('GET /api/invoices/:id returns invoice', async () => {
    const service = {
      list: async () => ({
        data: [],
        total: 0,
      }),
      getById: async () => invoice,
      create: async () => invoice,
    }

    const app = invoiceRoutes(service)

    const response = await app.handle(
      new Request(
        'http://localhost/api/invoices/550e8400-e29b-41d4-a716-446655440000',
      ),
    )

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data.id).toBe(invoice.id)
    expect(body.data.invoiceCode).toBe(invoice.invoiceCode)
    expect(body.data.nominal).toBe('150000.00')
  })

  test('POST /api/invoices creates invoice', async () => {
    let receivedInput: unknown = null

    const service = {
      list: async () => ({
        data: [],
        total: 0,
      }),
      getById: async () => invoice,
      create: async (input: unknown) => {
        receivedInput = input
        return invoice
      },
    }

    const app = invoiceRoutes(service)

    const response = await app.handle(
      new Request('http://localhost/api/invoices', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          studentId: invoice.studentId,
          paymentTypeId: invoice.paymentTypeId,
          period: invoice.period,
          discount: '10000.00',
          discountReason: 'Beasiswa',
          notes: 'Test invoice',
        }),
      }),
    )

    expect(response.status).toBe(201)

    const body = await response.json()

    expect(body.data.id).toBe(invoice.id)
    expect(body.data.payable).toBe('140000.00')

    expect(receivedInput).toEqual({
      studentId: invoice.studentId,
      paymentTypeId: invoice.paymentTypeId,
      period: invoice.period,
      discount: '10000.00',
      discountReason: 'Beasiswa',
      notes: 'Test invoice',
    })
  })

  test('GET /api/invoices/:id maps INVOICE_NOT_FOUND to standard API error', async () => {
    const service = {
      list: async () => ({
        data: [],
        total: 0,
      }),
      getById: async () => {
        throw new InvoiceServiceError(
          'INVOICE_NOT_FOUND',
          'Invoice not found',
        )
      },
      create: async () => invoice,
    }

    const app = createApp(service)

    const response = await app.handle(
      new Request(
        'http://localhost/api/invoices/550e8400-e29b-41d4-a716-446655440000',
      ),
    )

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')

    const body = await response.json()

    expect(body).toEqual({
      error: {
        code: 'INVOICE_NOT_FOUND',
        message: 'Invoice not found',
        details: null,
      },
    })
  })
})
