import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetMobilePasswordAction } from './mobile-reset-actions'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const TOKEN = 'a'.repeat(64)
const PASSWORD = 'correct horse battery'

describe('resetMobilePasswordAction', () => {
  it('posts token and password in the body only', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    expect(await resetMobilePasswordAction(TOKEN, PASSWORD)).toEqual({ status: 'success' })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url.endsWith('/mobile-auth/reset-password')).toBe(true)
    expect(url).not.toContain(TOKEN)
    expect(JSON.parse(String(init.body))).toEqual({ token: TOKEN, password: PASSWORD })
  })

  it.each([400, 404, 410])('reports an invalid token for API status %i', async (status) => {
    fetchMock.mockResolvedValue(new Response('{}', { status }))
    expect(await resetMobilePasswordAction(TOKEN, PASSWORD)).toEqual({ status: 'invalidToken' })
  })

  it('reports rate limiting separately so the user can retry', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 429 }))
    expect(await resetMobilePasswordAction(TOKEN, PASSWORD)).toEqual({ status: 'rateLimited' })
  })

  it('reports a generic error on server failure or network failure', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    expect(await resetMobilePasswordAction(TOKEN, PASSWORD)).toEqual({ status: 'error' })
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    expect(await resetMobilePasswordAction(TOKEN, PASSWORD)).toEqual({ status: 'error' })
  })

  it('enforces the shared password policy without calling the API', async () => {
    expect(await resetMobilePasswordAction(TOKEN, 'short')).toEqual({ status: 'invalidPassword' })
    expect(await resetMobilePasswordAction(TOKEN, 'x'.repeat(129))).toEqual({
      status: 'invalidPassword',
    })
    expect(await resetMobilePasswordAction('', PASSWORD)).toEqual({ status: 'invalidToken' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
