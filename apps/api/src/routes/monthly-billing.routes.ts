import { Elysia } from 'elysia'

import {
  toMonthlyBillingDto,
  type CreateMonthlyBillingDto,
} from '../dto/monthly-billing.dto.ts'

import {
  CreateMonthlyBillingSchema,
  MonthlyBillingResponseSchema,
} from '../schemas/monthly-billing.schema.ts'

import { ApiError } from '../errors/api-error.ts'

import {
  MonthlyBillingService,
  MonthlyBillingServiceError,
} from '../services/monthly-billing.service.ts'

type MonthlyBillingServiceContract = Pick<
  MonthlyBillingService,
  'generate'
>

function mapMonthlyBillingServiceError(
  error: MonthlyBillingServiceError,
): ApiError {
  const statusByCode: Record<string, number> = {
    INVALID_BILLING_PERIOD: 422,
    ACADEMIC_YEAR_NOT_FOUND_FOR_PERIOD: 422,
  }

  return new ApiError(
    error.code,
    error.message,
    statusByCode[error.code] ?? 422,
    null,
  )
}

function handleMonthlyBillingServiceError(
  error: unknown,
): never {
  if (error instanceof MonthlyBillingServiceError) {
    throw mapMonthlyBillingServiceError(error)
  }

  throw error
}

export const monthlyBillingRoutes = (
  monthlyBillingService: MonthlyBillingServiceContract =
    new MonthlyBillingService(),
) =>
  new Elysia({
    name: 'monthly-billing-routes',
  }).post(
    '/api/monthly-billing',
    async ({ body, set }) => {
      try {
        const input =
          body as CreateMonthlyBillingDto

        const result =
          await monthlyBillingService.generate(
            input.period,
          )

        set.status = 200

        return {
          data: toMonthlyBillingDto(result),
        }
      } catch (error) {
        return handleMonthlyBillingServiceError(
          error,
        )
      }
    },
    {
      body: CreateMonthlyBillingSchema,
      response: MonthlyBillingResponseSchema,
    },
  )
