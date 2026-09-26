import {
  describe,
  expect,
  test,
} from 'bun:test'

import { createApp } from '../src/app.ts'
import { ApiError } from '../src/errors/api-error.ts'

describe('Global error handling', () => {
  test('returns standard response for known API error', async () => {
    const app = createApp().get(
      '/api/test-api-error',
      () => {
        throw new ApiError(
          'TEST_ERROR',
          'Test error',
          422,
          {
            source: 'health-test',
          },
        )
      },
    )

    const response = await app.handle(
      new Request(
        'http://localhost/api/test-api-error',
      ),
    )

    expect(response.status).toBe(422)

    expect(
      await response.json(),
    ).toEqual({
      error: {
        code: 'TEST_ERROR',
        message: 'Test error',
        details: {
          source: 'health-test',
        },
      },
    })
  })

  test('returns standard response for unknown route', async () => {
    const app = createApp()

    const response = await app.handle(
      new Request(
        'http://localhost/api/not-found',
      ),
    )

    expect(response.status).toBe(404)

    expect(
      await response.json(),
    ).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        details: null,
      },
    })
  })

  test('returns generic 500 for unexpected error', async () => {
    const app = createApp().get(
      '/api/test-unexpected-error',
      () => {
        throw new Error(
          'This error must never be exposed',
        )
      },
    )

    const response = await app.handle(
      new Request(
        'http://localhost/api/test-unexpected-error',
      ),
    )

    expect(response.status).toBe(500)

    expect(
      await response.json(),
    ).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null,
      },
    })
  })

  test('does not expose internal stack trace', async () => {
    const app = createApp().get(
      '/api/test-unexpected-error',
      () => {
        throw new Error(
          'This error must never be exposed',
        )
      },
    )

    const response = await app.handle(
      new Request(
        'http://localhost/api/test-unexpected-error',
      ),
    )

    const body = await response.text()

    expect(body).not.toContain(
      'This error must never be exposed',
    )

    expect(body).not.toContain('stack')

    expect(body).not.toContain(
      'error-handler.ts',
    )
  })
})
