import { afterEach, describe, expect, it, vi } from 'vitest'
import { forgotPasswordAction, resetPasswordAction } from './password-reset-actions'

const respond = (status: number) => vi.fn().mockResolvedValue(new Response(null, { status }))

describe('forgotPasswordAction', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('treats the API 204 as sent, whatever the address', async () => {
    vi.stubGlobal('fetch', respond(204))

    expect(await forgotPasswordAction({ email: 'ops@example.gr' })).toEqual({ ok: true })
  })

  it('maps 429 to tooManyAttempts', async () => {
    vi.stubGlobal('fetch', respond(429))

    expect(await forgotPasswordAction({ email: 'ops@example.gr' })).toEqual({
      ok: false,
      errorKey: 'tooManyAttempts',
    })
  })

  it('maps a server error and a network failure to genericError', async () => {
    vi.stubGlobal('fetch', respond(500))
    expect(await forgotPasswordAction({ email: 'ops@example.gr' })).toEqual({
      ok: false,
      errorKey: 'genericError',
    })

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    expect(await forgotPasswordAction({ email: 'ops@example.gr' })).toEqual({
      ok: false,
      errorKey: 'genericError',
    })
  })
})

describe('resetPasswordAction', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns ok on success instead of redirecting, so the page can carry the address over', async () => {
    vi.stubGlobal('fetch', respond(204))

    expect(await resetPasswordAction('tok', { password: 'a-long-enough-pass' })).toEqual({
      ok: true,
    })
  })

  it('maps the API 400 (unknown, expired or used token) to invalidToken', async () => {
    vi.stubGlobal('fetch', respond(400))

    expect(await resetPasswordAction('tok', { password: 'a-long-enough-pass' })).toEqual({
      ok: false,
      errorKey: 'invalidToken',
    })
  })

  it('maps 429 to tooManyAttempts and 5xx to genericError', async () => {
    vi.stubGlobal('fetch', respond(429))
    expect(await resetPasswordAction('tok', { password: 'a-long-enough-pass' })).toEqual({
      ok: false,
      errorKey: 'tooManyAttempts',
    })

    vi.stubGlobal('fetch', respond(503))
    expect(await resetPasswordAction('tok', { password: 'a-long-enough-pass' })).toEqual({
      ok: false,
      errorKey: 'genericError',
    })
  })
})
