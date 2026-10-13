import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiFetch = vi.fn()
const getActiveSession = vi.fn()

vi.mock('./api', () => {
  class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly errors?: unknown,
      readonly code?: string,
    ) {
      super(message)
    }
  }
  class AuthRequiredError extends Error {}
  return { apiFetch: (...args: unknown[]) => apiFetch(...args), ApiError, AuthRequiredError }
})
vi.mock('./session', () => ({ getActiveSession: () => getActiveSession() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`)
  },
}))

import { ApiError, AuthRequiredError } from './api'
import {
  eraseMobileUserAction,
  reactivateMobileUserAction,
  revokeMobileUserSessionsAction,
  suspendMobileUserAction,
} from './mobile-user-actions'

function sessionAs(role: string | null) {
  getActiveSession.mockResolvedValue(
    role === null
      ? {}
      : { accessToken: 'tok', user: { id: 'u1', email: 'a@b.co', role, emailVerified: true } },
  )
}

beforeEach(() => {
  apiFetch.mockReset().mockResolvedValue(undefined)
  getActiveSession.mockReset()
})

describe('permission gate', () => {
  it.each(['platform_admin', 'operator_admin', 'user'])(
    'refuses %s without calling the API',
    async (role) => {
      sessionAs(role)
      const results = await Promise.all([
        suspendMobileUserAction('cm1', 'abuse reported'),
        reactivateMobileUserAction('cm1', 'resolved'),
        revokeMobileUserSessionsAction('cm1', 'lost phone'),
        eraseMobileUserAction('cm1', 'gdpr request', 'rider@example.com'),
      ])
      for (const result of results) {
        expect(result).toEqual({ ok: false, errorKey: 'errors.forbidden' })
      }
      expect(apiFetch).not.toHaveBeenCalled()
    },
  )

  it('refuses a request with no session', async () => {
    sessionAs(null)
    expect(await suspendMobileUserAction('cm1', 'abuse reported')).toEqual({
      ok: false,
      errorKey: 'errors.forbidden',
    })
    expect(apiFetch).not.toHaveBeenCalled()
  })
})

describe('as super_admin', () => {
  beforeEach(() => sessionAs('super_admin'))

  it.each([
    ['suspend', () => suspendMobileUserAction('cm1', ' abuse reported ')],
    ['reactivate', () => reactivateMobileUserAction('cm1', ' appeal won ')],
    ['revoke-sessions', () => revokeMobileUserSessionsAction('cm1', ' lost phone ')],
  ])('posts %s with the trimmed reason', async (suffix, run) => {
    expect(await run()).toEqual({ ok: true })
    const [path, init] = apiFetch.mock.calls[0] as [string, RequestInit]
    expect(path).toBe(`/admin/mobile-users/cm1/${suffix}`)
    expect(init.method).toBe('POST')
    const { reason } = JSON.parse(String(init.body)) as { reason: string }
    expect(reason).toBe(reason.trim())
    expect(reason.length).toBeGreaterThanOrEqual(3)
  })

  it('rejects a short reason before any request', async () => {
    expect(await suspendMobileUserAction('cm1', 'ab')).toEqual({
      ok: false,
      errorKey: 'errors.invalidReason',
    })
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('rejects an id that is not a plain identifier', async () => {
    expect(await suspendMobileUserAction('../users/x', 'abuse reported')).toEqual({
      ok: false,
      errorKey: 'errors.notFound',
    })
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('sends reason and confirmEmail on erase', async () => {
    expect(await eraseMobileUserAction('cm1', 'gdpr request', ' Rider@Example.com ')).toEqual({
      ok: true,
    })
    const [path, init] = apiFetch.mock.calls[0] as [string, RequestInit]
    expect(path).toBe('/admin/mobile-users/cm1/erase')
    expect(JSON.parse(String(init.body))).toEqual({
      reason: 'gdpr request',
      confirmEmail: 'rider@example.com',
    })
  })

  it('refuses erase with a malformed confirmation email or no reason', async () => {
    expect(await eraseMobileUserAction('cm1', 'gdpr request', 'not-an-email')).toEqual({
      ok: false,
      errorKey: 'errors.emailMismatch',
    })
    expect(await eraseMobileUserAction('cm1', '', 'a@b.co')).toEqual({
      ok: false,
      errorKey: 'errors.invalidReason',
    })
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('maps an erase 409 to the unsettled-bookings error with the API detail', async () => {
    apiFetch.mockRejectedValue(new ApiError('2 bookings are unsettled', 409))
    expect(await eraseMobileUserAction('cm1', 'gdpr request', 'rider@example.com')).toEqual({
      ok: false,
      errorKey: 'errors.unsettledBookings',
      detail: '2 bookings are unsettled',
    })
  })

  it('maps an erase status-transition 409 to the generic conflict', async () => {
    apiFetch.mockRejectedValue(
      new ApiError(
        'A deleted account cannot be erased',
        409,
        undefined,
        'invalid_status_transition',
      ),
    )
    expect(await eraseMobileUserAction('cm1', 'gdpr request', 'rider@example.com')).toMatchObject({
      errorKey: 'errors.conflict',
    })
  })

  it('maps an erase 422 to the email mismatch error', async () => {
    apiFetch.mockRejectedValue(new ApiError('mismatch', 422, undefined, 'confirmation_mismatch'))
    expect(await eraseMobileUserAction('cm1', 'gdpr request', 'rider@example.com')).toEqual({
      ok: false,
      errorKey: 'errors.emailMismatch',
    })
  })

  it('maps a suspend 409 to the generic conflict', async () => {
    apiFetch.mockRejectedValue(new ApiError('already suspended', 409))
    expect(await suspendMobileUserAction('cm1', 'abuse reported')).toMatchObject({
      errorKey: 'errors.conflict',
    })
  })

  it.each([
    [403, 'errors.forbidden'],
    [404, 'errors.notFound'],
    [429, 'errors.rateLimited'],
    [500, 'errors.genericError'],
  ])('maps API status %i to %s', async (status, errorKey) => {
    apiFetch.mockRejectedValue(new ApiError('x', status))
    expect(await suspendMobileUserAction('cm1', 'abuse reported')).toMatchObject({
      ok: false,
      errorKey,
    })
  })

  it('sends an unauthenticated API response to the login page', async () => {
    apiFetch.mockRejectedValue(new AuthRequiredError())
    await expect(suspendMobileUserAction('cm1', 'abuse reported')).rejects.toThrow(
      'redirect:/login',
    )
  })
})
