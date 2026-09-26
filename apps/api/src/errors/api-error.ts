export type ApiErrorDetails =
  Record<string, unknown> | null

export type ApiErrorResponse = {
  error: {
    code: string
    message: string
    details: ApiErrorDetails
  }
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 500,
    public readonly details: ApiErrorDetails = null,
  ) {
    super(message)

    this.name = 'ApiError'
  }
}
