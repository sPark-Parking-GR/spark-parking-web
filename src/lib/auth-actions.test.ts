import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const establishSessions = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('./session', () => ({
  clearAllSessions: vi.fn(),
  establishSessions,
  getActiveSession: vi.fn(),
  isDashboardRole: (role: string | undefined) => role === 'operator_admin',
}))

import { signInAction } from './auth-actions'

const CREDENTIALS = { email: 'ops@example.gr', password: 'correct horse' }

function authResult(role: string) {
  return {
    session: {
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: 1_900_000_000,
      user: { id: 'u1', email: CREDENTIALS.email, role, emailVerified: true },
    },
  }
}

function respond(status: number, body?: unknown, headers?: Record<string, string>) {
  return vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    }),
  )
}

describe('signInAction', () => {
  beforeEach(() => {
    establishSessions.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('establishes the session and returns the safe redirect on success', async () => {
    vi.stubGlobal('fetch', respond(200, authResult('operator_admin')))

    const result = await signInAction(CREDENTIALS, '/dashboard/billing')

    expect(result).toEqual({ ok: true, redirectTo: '/dashboard/billing' })
    expect(establishSessions).toHaveBeenCalledOnce()
  })

  it('keeps the session browser-scoped unless "remember me" was ticked', async () => {
    vi.stubGlobal('fetch', respond(200, authResult('operator_admin')))

    await signInAction(CREDENTIALS)

    expect(establishSessions).toHaveBeenLastCalledWith(expect.anything(), { remember: false })
  })

  it('passes "remember me" through to the session', async () => {
    vi.stubGlobal('fetch', respond(200, authResult('operator_admin')))

    await signInAction(CREDENTIALS, undefined, { remember: true })

    expect(establishSessions).toHaveBeenLastCalledWith(expect.anything(), { remember: true })
  })

  it.each([[null], [{ remember: 'yes' }], [{ remember: 1 }]])(
    'treats a malformed options argument %j as not remembered, without throwing',
    async (options) => {
      vi.stubGlobal('fetch', respond(200, authResult('operator_admin')))

      const result = await signInAction(
        CREDENTIALS,
        undefined,
        options as unknown as { remember?: boolean },
      )

      expect(result.ok).toBe(true)
      expect(establishSessions).toHaveBeenLastCalledWith(expect.anything(), { remember: false })
    },
  )

  it('never forwards the remember flag to the API', async () => {
    const fetchMock = respond(200, authResult('operator_admin'))
    vi.stubGlobal('fetch', fetchMock)

    await signInAction(CREDENTIALS, undefined, { remember: true })

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(init.body as string)).toEqual({
      email: CREDENTIALS.email,
      password: CREDENTIALS.password,
    })
  })

  it('refuses an open-redirect target and lands on the dashboard', async () => {
    vi.stubGlobal('fetch', respond(200, authResult('operator_admin')))

    const result = await signInAction(CREDENTIALS, '//evil.example')

    expect(result).toEqual({ ok: true, redirectTo: '/dashboard' })
  })

  it('refuses a signed-in account whose role has no dashboard access', async () => {
    vi.stubGlobal('fetch', respond(200, authResult('driver')))

    const result = await signInAction(CREDENTIALS)

    expect(result).toEqual({ ok: false, errorKey: 'notAuthorized' })
    expect(establishSessions).not.toHaveBeenCalled()
  })

  it.each([[401], [403]])('maps %i to the generic invalid-credentials message', async (status) => {
    vi.stubGlobal('fetch', respond(status, { message: 'locked: too many failures' }))

    expect(await signInAction(CREDENTIALS)).toEqual({ ok: false, errorKey: 'invalidCredentials' })
  })

  it('maps 429 to tooManyAttempts with the Retry-After seconds', async () => {
    vi.stubGlobal('fetch', respond(429, undefined, { 'Retry-After': '42' }))

    expect(await signInAction(CREDENTIALS)).toEqual({
      ok: false,
      errorKey: 'tooManyAttempts',
      retryAfter: 42,
    })
  })

  it.each([
    ['is missing', undefined, 60],
    ['is not a number', 'soon', 60],
    ['is zero', '0', 60],
    ['is absurdly large', '999999', 3600],
  ])('falls back to a sane cooldown when Retry-After %s', async (_name, header, expected) => {
    vi.stubGlobal(
      'fetch',
      respond(429, undefined, header === undefined ? {} : { 'Retry-After': header }),
    )

    expect(await signInAction(CREDENTIALS)).toEqual({
      ok: false,
      errorKey: 'tooManyAttempts',
      retryAfter: expected,
    })
  })

  it.each([[500], [502], [503]])('maps %i to signInFailed', async (status) => {
    vi.stubGlobal('fetch', respond(status))

    expect(await signInAction(CREDENTIALS)).toEqual({ ok: false, errorKey: 'signInFailed' })
  })

  it('maps a network failure to signInFailed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

    expect(await signInAction(CREDENTIALS)).toEqual({ ok: false, errorKey: 'signInFailed' })
  })

  it('maps a timeout to signInFailed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError')),
    )

    expect(await signInAction(CREDENTIALS)).toEqual({ ok: false, errorKey: 'signInFailed' })
  })

  it('sends the request with a 20 second abort signal', async () => {
    const fetchMock = respond(200, authResult('operator_admin'))
    vi.stubGlobal('fetch', fetchMock)
    const timeout = vi.spyOn(AbortSignal, 'timeout')

    await signInAction(CREDENTIALS)

    expect(timeout).toHaveBeenCalledWith(20_000)
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.signal).toBeInstanceOf(AbortSignal)
    timeout.mockRestore()
  })

  it('rejects a malformed address without calling the API', async () => {
    const fetchMock = respond(200, authResult('operator_admin'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await signInAction({ email: 'not-an-email', password: 'x' })

    expect(result).toEqual({ ok: false, errorKey: 'credentialsInvalid' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
