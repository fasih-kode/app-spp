import { Elysia } from 'elysia'

import { ApiError } from './errors/api-error.ts'
import { invoiceRoutes } from './routes/invoice.routes.ts'
import { InvoiceService } from './services/invoice.service.ts'

type InvoiceServiceContract = Pick<
  InvoiceService,
  'list' | 'getById' | 'create'
>

export function createApp(
  invoiceService: InvoiceServiceContract = new InvoiceService(),
) {
  const app = new Elysia({
    name: 'e-pembayaran-spp-api',
  })
    .onError(({ code, error }) => {
      if (code === 'NOT_FOUND') {
        return Response.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Resource not found',
              details: null,
            },
          },
          {
            status: 404,
          },
        )
      }

      if (error instanceof ApiError) {
        return Response.json(
          {
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          {
            status: error.status,
          },
        )
      }

      return Response.json(
        {
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
            details: null,
          },
        },
        {
          status: 500,
        },
      )
    })
    .get('/api/health', () => ({
      data: {
        status: 'ok',
      },
    }))

  return app.use(invoiceRoutes(invoiceService))
}
