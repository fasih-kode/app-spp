import {
  toMonthlyBillingDto,
} from '../../src/dto/monthly-billing.dto.ts'

const invoice = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  invoiceCode: 'INV-202609-ABCDEFGH',
  studentId: '550e8400-e29b-41d4-a716-446655440011',
  academicYearId: '550e8400-e29b-41d4-a716-446655440012',
  classId: '550e8400-e29b-41d4-a716-446655440013',
  paymentTypeId: '550e8400-e29b-41d4-a716-446655440014',
  period: '2026-09-01',
  dueDate: '2026-09-10',
  nominal: '150000.00',
  discount: '0.00',
  payable: '150000.00',
  status: 'UNPAID',
  discountReason: null,
  notes: 'Monthly billing',
  cancelledAt: null,
  cancelledReason: null,
  createdAt: new Date('2026-09-01T01:00:00.000Z'),
  updatedAt: new Date('2026-09-01T01:00:00.000Z'),
}

const result = {
  period: '2026-09-01',
  academicYearId: invoice.academicYearId,
  studentsScanned: 2,
  paymentTypesScanned: 1,
  generated: 1,
  skipped: 0,
  failed: 1,
  items: [
    {
      studentId: invoice.studentId,
      paymentTypeId: invoice.paymentTypeId,
      status: 'CREATED' as const,
      invoice,
    },
    {
      studentId: '550e8400-e29b-41d4-a716-446655440020',
      paymentTypeId: invoice.paymentTypeId,
      status: 'FAILED' as const,
      errorCode: 'RATE_NOT_FOUND',
      message: 'Active monthly rate not found',
    },
  ],
}

const dto = toMonthlyBillingDto(result)

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

assert(
  dto.period === '2026-09-01',
  'PERIOD_NOT_MAPPED',
)

assert(
  dto.academicYearId === invoice.academicYearId,
  'ACADEMIC_YEAR_ID_NOT_MAPPED',
)

assert(
  dto.studentsScanned === 2 &&
    dto.paymentTypesScanned === 1,
  'SCAN_COUNTS_NOT_MAPPED',
)

assert(
  dto.generated === 1 &&
    dto.skipped === 0 &&
    dto.failed === 1,
  'SUMMARY_COUNTS_NOT_MAPPED',
)

assert(
  dto.items.length === 2,
  'ITEM_COUNT_NOT_MAPPED',
)

const created = dto.items[0]

assert(
  created.studentId === invoice.studentId &&
    created.paymentTypeId === invoice.paymentTypeId &&
    created.status === 'CREATED',
  'CREATED_ITEM_NOT_MAPPED',
)

assert(
  created.invoice?.id === invoice.id &&
    created.invoice.invoiceCode === invoice.invoiceCode &&
    created.invoice.nominal === invoice.nominal &&
    created.invoice.payable === invoice.payable,
  'INVOICE_NOT_MAPPED',
)

const failed = dto.items[1]

assert(
  failed.status === 'FAILED' &&
    failed.errorCode === 'RATE_NOT_FOUND' &&
    failed.message === 'Active monthly rate not found',
  'FAILED_ITEM_NOT_MAPPED',
)

assert(
  failed.invoice === undefined,
  'FAILED_ITEM_MUST_NOT_HAVE_INVOICE',
)

console.log('PASS: billing summary mapping')
console.log('PASS: created item mapping')
console.log('PASS: nested invoice mapping')
console.log('PASS: failed item mapping')
console.log('PASS: optional invoice omission')
console.log('MONTHLY BILLING DTO MAPPER TEST: 5/5 PASS')
