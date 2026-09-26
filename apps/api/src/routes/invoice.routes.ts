import { Elysia } from 'elysia'
import {
  toInvoiceDto,
  toInvoiceListDto,
  type CreateInvoiceDto,
  type InvoiceListQueryDto,
} from '../dto/invoice.dto.ts'
import {
  CreateInvoiceSchema,
  InvoiceIdParamsSchema,
  InvoiceListQuerySchema,
  InvoiceListResponseSchema,
  InvoiceResponseSchema,
} from '../schemas/invoice.schema.ts'
import { ApiError } from '../errors/api-error.ts'
import {
  InvoiceService,
  InvoiceServiceError,
} from '../services/invoice.service.ts'

type InvoiceServiceContract = Pick<
  InvoiceService,
  'list' | 'getById' | 'create'
>

function mapInvoiceServiceError(error: InvoiceServiceError): ApiError {
  const statusByCode: Record<string, number> = {
    INVOICE_NOT_FOUND: 404,
    STUDENT_NOT_FOUND: 404,
    PAYMENT_TYPE_NOT_FOUND: 404,
    ACADEMIC_YEAR_NOT_FOUND_FOR_PERIOD: 422,
    NO_ACTIVE_CLASS_HISTORY: 422,
    STUDENT_NOT_ACTIVE: 422,
    PAYMENT_TYPE_INACTIVE: 422,
    RATE_NOT_FOUND: 422,
    INVALID_INVOICE_PERIOD: 422,
    INVALID_INVOICE_NOMINAL: 422,
    INVALID_DISCOUNT: 422,
    DISCOUNT_REASON_REQUIRED: 422,
    INVOICE_ALREADY_EXISTS: 409,
  }

  return new ApiError(
    error.code,
    error.message,
    statusByCode[error.code] ?? 422,
    null,
  )
}

function handleInvoiceServiceError(error: unknown): never {
  if (error instanceof InvoiceServiceError) {
    throw mapInvoiceServiceError(error)
  }

  throw error
}

export const invoiceRoutes = (
  invoiceService: InvoiceServiceContract = new InvoiceService(),
) =>
  new Elysia({ name: 'invoice-routes' })
    .get(
      '/api/invoices',
      async ({ query }) => {
        try {
          const params = query as InvoiceListQueryDto
          const page = params.page ?? 1
          const perPage = params.perPage ?? 20

          const result = await invoiceService.list({
            ...params,
            page,
            perPage,
          })

          return toInvoiceListDto(result, page, perPage)
        } catch (error) {
          return handleInvoiceServiceError(error)
        }
      },
      {
        query: InvoiceListQuerySchema,
        response: InvoiceListResponseSchema,
      },
    )
    .get(
      '/api/invoices/:id',
      async ({ params }) => {
        try {
          const invoice = await invoiceService.getById(params.id)

          return {
            data: toInvoiceDto(invoice),
          }
        } catch (error) {
          return handleInvoiceServiceError(error)
        }
      },
      {
        params: InvoiceIdParamsSchema,
        response: InvoiceResponseSchema,
      },
    )
    .post(
      '/api/invoices',
      async ({ body, set }) => {
        try {
          const input = body as CreateInvoiceDto
          const invoice = await invoiceService.create(input)

          set.status = 201

          return {
            data: toInvoiceDto(invoice),
          }
        } catch (error) {
          return handleInvoiceServiceError(error)
        }
      },
      {
        body: CreateInvoiceSchema,
        response: InvoiceResponseSchema,
      },
    )
