import { describe, expect, test } from 'bun:test'
import { Value } from '@sinclair/typebox/value'

import {
  CreateInvoiceSchema,
  InvoiceListQuerySchema,
  InvoiceSchema,
} from '../../src/schemas/invoice.schema.ts'

describe('Invoice schemas', () => {
  describe('CreateInvoiceSchema', () => {
    test('accepts valid input', () => {
      const input = {
        studentId: '550e8400-e29b-41d4-a716-446655440000',
        paymentTypeId: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
        period: '2026-09-01',
        discount: '10000.00',
        discountReason: 'Beasiswa',
        notes: 'Test invoice',
      }

      expect(
        Value.Check(CreateInvoiceSchema, input),
      ).toBe(true)
    })

    test('rejects invalid student UUID', () => {
      const input = {
        studentId: 'bukan-uuid',
        paymentTypeId: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
        period: '2026-09-01',
      }

      expect(
        Value.Check(CreateInvoiceSchema, input),
      ).toBe(false)
    })

    test('rejects invalid payment type UUID', () => {
      const input = {
        studentId: '550e8400-e29b-41d4-a716-446655440000',
        paymentTypeId: 'bukan-uuid',
        period: '2026-09-01',
      }

      expect(
        Value.Check(CreateInvoiceSchema, input),
      ).toBe(false)
    })

    test('rejects invalid period', () => {
      const input = {
        studentId: '550e8400-e29b-41d4-a716-446655440000',
        paymentTypeId: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
        period: 'September 2026',
      }

      expect(
        Value.Check(CreateInvoiceSchema, input),
      ).toBe(false)
    })

    test('rejects invalid money format', () => {
      const input = {
        studentId: '550e8400-e29b-41d4-a716-446655440000',
        paymentTypeId: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
        period: '2026-09-01',
        discount: 'Rp 10.000',
      }

      expect(
        Value.Check(CreateInvoiceSchema, input),
      ).toBe(false)
    })

    test('accepts input without optional fields', () => {
      const input = {
        studentId: '550e8400-e29b-41d4-a716-446655440000',
        paymentTypeId: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
        period: '2026-09-01',
      }

      expect(
        Value.Check(CreateInvoiceSchema, input),
      ).toBe(true)
    })
  })

  describe('InvoiceListQuerySchema', () => {
    test('accepts valid filters', () => {
      const input = {
        studentId: '550e8400-e29b-41d4-a716-446655440000',
        academicYearId:
          '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
        classId:
          '7ba7b810-9dad-41d1-80b4-00c04fd430c8',
        paymentTypeId:
          '8ba7b810-9dad-41d1-80b4-00c04fd430c8',
        period: '2026-09-01',
        status: 'UNPAID',
        page: 1,
        perPage: 20,
        sortBy: 'period',
        sortDirection: 'desc',
      }

      expect(
        Value.Check(InvoiceListQuerySchema, input),
      ).toBe(true)
    })

    test('rejects unknown invoice status', () => {
      const input = {
        status: 'INVALID_STATUS',
      }

      expect(
        Value.Check(InvoiceListQuerySchema, input),
      ).toBe(false)
    })

    test('rejects perPage above maximum', () => {
      const input = {
        perPage: 101,
      }

      expect(
        Value.Check(InvoiceListQuerySchema, input),
      ).toBe(false)
    })

    test('rejects page below minimum', () => {
      const input = {
        page: 0,
      }

      expect(
        Value.Check(InvoiceListQuerySchema, input),
      ).toBe(false)
    })
  })

  describe('InvoiceSchema', () => {
    test('accepts valid invoice response', () => {
      const invoice = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        invoiceCode: 'INV-202609-000001',

        studentId:
          '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
        academicYearId:
          '7ba7b810-9dad-41d1-80b4-00c04fd430c8',
        classId:
          '8ba7b810-9dad-41d1-80b4-00c04fd430c8',
        paymentTypeId:
          '9ba7b810-9dad-41d1-80b4-00c04fd430c8',

        period: '2026-09-01',
        dueDate: '2026-09-10',

        nominal: '150000.00',
        discount: '10000.00',
        payable: '140000.00',

        status: 'UNPAID',

        discountReason: 'Beasiswa',
        notes: null,

        cancelledAt: null,
        cancelledReason: null,

        createdAt: '2026-09-25T10:00:00.000Z',
        updatedAt: '2026-09-25T10:00:00.000Z',
      }

      expect(
        Value.Check(InvoiceSchema, invoice),
      ).toBe(true)
    })

    test('rejects invalid invoice status', () => {
      const invoice = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        invoiceCode: 'INV-202609-000001',
        studentId:
          '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
        academicYearId:
          '7ba7b810-9dad-41d1-80b4-00c04fd430c8',
        classId:
          '8ba7b810-9dad-41d1-80b4-00c04fd430c8',
        paymentTypeId:
          '9ba7b810-9dad-41d1-80b4-00c04fd430c8',
        period: '2026-09-01',
        dueDate: '2026-09-10',
        nominal: '150000.00',
        discount: '10000.00',
        payable: '140000.00',
        status: 'INVALID',
        discountReason: null,
        notes: null,
        cancelledAt: null,
        cancelledReason: null,
        createdAt: '2026-09-25T10:00:00.000Z',
        updatedAt: '2026-09-25T10:00:00.000Z',
      }

      expect(
        Value.Check(InvoiceSchema, invoice),
      ).toBe(false)
    })
  })
})
