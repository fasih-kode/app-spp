import { describe, expect, test } from 'bun:test'

import { createApp } from '../src/app.ts'

describe('GET /api/health', () => {
  test('returns healthy response', async () => {
    const app = createApp()

    const response = await app.handle(
      new Request(
        'http://localhost/api/health',
      ),
    )

    expect(response.status).toBe(200)

    expect(
      await response.json(),
    ).toEqual({
      data: {
        status: 'ok',
      },
    })
  })
})
