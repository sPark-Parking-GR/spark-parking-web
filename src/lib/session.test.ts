import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const cookieStore = vi.hoisted(() => {
  const jar = new Map<string, { value: string; options: Record<string, unknown> }>()
  return {
    jar,
    get: (name: string) => {
      const entry = jar.get(name)
      return entry ? { name, value: entry.value } : undefined
    },
    set: (name: string, value: string, options: Record<string, unknown>) => {
      jar.set(name, { value, options })
    },
  }
})

vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue(cookieStore) }))

import {
  dashboardSessionOptions,
  establishSessions,
  expireIfPastDeadline,
  getSession,
  optionsForSession,
  persistSession,
  sessionDeadline,
} from './session'

const NOW = 1_800_000_000_000
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

beforeAll(() => {
  vi.stubEnv('SESSION_SECRET', 'x'.repeat(40))
})

describe('sessionDeadline', () => {
  it('gives a remembered sign-in a week', () => {
    expect(sessionDeadline(true, NOW)).toBe(NOW + 7 * DAY)
  })

  it('caps a browser-session sign-in at twelve hours', () => {
    expect(sessionDeadline(false, NOW)).toBe(NOW + 12 * HOUR)
  })
})

describe('optionsForSession', () => {
  it('seals a remembered session for what is left of its fixed week, not a fresh one', () => {
    const options = optionsForSession('dashboard', { remember: true, endsAt: NOW + 2 * DAY }, NOW)

    expect(options.ttl).toBe(2 * 24 * 60 * 60)
    expect(options.cookieOptions).not.toHaveProperty('maxAge')
  })

  it('never seals with a ttl that iron-session reads as "no expiry" or an instantly dead cookie', () => {
    const options = optionsForSession('dashboard', { remember: true, endsAt: NOW + 5000 }, NOW)

    expect(options.ttl).toBeGreaterThan(60)
  })

  it('leaves Max-Age off an unremembered session so the browser drops it on close', () => {
    const options = optionsForSession('dashboard', { remember: false, endsAt: NOW + HOUR }, NOW)

    expect(options.cookieOptions).toHaveProperty('maxAge', undefined)
    expect(options.cookieOptions?.httpOnly).toBe(true)
    expect(options.cookieOptions?.sameSite).toBe('lax')
    expect(options.cookieOptions?.path).toBe('/dashboard')
  })

  it('falls back to a remembered week if asked for options without a deadline', () => {
    const options = optionsForSession('dashboard', {}, NOW)

    expect(options.ttl).toBe(7 * 24 * 60 * 60)
  })

  it('leaves the 30 minute admin cookie alone whatever was ticked', () => {
    const options = optionsForSession('admin', { remember: true, endsAt: NOW + 7 * DAY }, NOW)

    expect(options.cookieName).toBe('spark_platform_admin_session')
    expect(options.ttl).toBe(30 * 60)
    expect(options.cookieOptions?.maxAge).toBe(30 * 60)
  })

  it('defaults the shared dashboard options to the remembered week', () => {
    expect(dashboardSessionOptions.ttl).toBe(7 * 24 * 60 * 60)
  })
})

describe('expireIfPastDeadline', () => {
  const live = { accessToken: 'token' }

  it('destroys a session whose deadline has passed', () => {
    const destroy = vi.fn()

    expireIfPastDeadline({ ...live, endsAt: NOW - 1, destroy }, 'dashboard', NOW)

    expect(destroy).toHaveBeenCalledOnce()
  })

  it('destroys at the exact deadline', () => {
    const destroy = vi.fn()

    expireIfPastDeadline({ ...live, endsAt: NOW, destroy }, 'dashboard', NOW)

    expect(destroy).toHaveBeenCalledOnce()
  })

  it('leaves a live session alone', () => {
    const destroy = vi.fn()

    expireIfPastDeadline({ ...live, endsAt: NOW + 1, destroy }, 'dashboard', NOW)

    expect(destroy).not.toHaveBeenCalled()
  })

  it('signs out an authenticated session from before deadlines existed, rather than extending it', () => {
    const destroy = vi.fn()

    expireIfPastDeadline({ ...live, destroy }, 'dashboard', NOW)

    expect(destroy).toHaveBeenCalledOnce()
  })

  it('leaves an empty session, one being established, alone', () => {
    const destroy = vi.fn()

    expireIfPastDeadline({ destroy }, 'dashboard', NOW)

    expect(destroy).not.toHaveBeenCalled()
  })

  it('never applies the dashboard deadline to the admin cookie', () => {
    const destroy = vi.fn()

    expireIfPastDeadline({ ...live, destroy }, 'admin', NOW)

    expect(destroy).not.toHaveBeenCalled()
  })

  it('survives a read-only render context where clearing the cookie throws', () => {
    const destroy = vi.fn(() => {
      throw new Error('Cookies can only be modified in a Server Action or Route Handler')
    })

    expect(() =>
      expireIfPastDeadline({ ...live, endsAt: NOW - 1, destroy }, 'dashboard', NOW),
    ).not.toThrow()
  })
})

describe('establishSessions (real iron-session, fake cookie jar)', () => {
  const OPERATOR = {
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresAt: 1_900_000_000,
    user: { id: 'u1', email: 'ops@example.gr', role: 'operator_admin', emailVerified: true },
  } as const

  beforeEach(() => {
    cookieStore.jar.clear()
  })

  it('writes a persistent cookie of about a week for a remembered sign-in', async () => {
    await establishSessions(OPERATOR, { remember: true })

    const options = cookieStore.jar.get('spark_dashboard_session')?.options
    expect(options?.maxAge).toBeGreaterThan(6 * 24 * 60 * 60)
    expect(options?.maxAge).toBeLessThanOrEqual(7 * 24 * 60 * 60)
  })

  it('writes a session cookie, with no Max-Age, when "remember me" is unticked', async () => {
    await establishSessions(OPERATOR, { remember: false })

    const options = cookieStore.jar.get('spark_dashboard_session')?.options
    expect(options).toBeDefined()
    expect(options?.maxAge).toBeUndefined()
    expect(options?.httpOnly).toBe(true)
    expect(options?.path).toBe('/dashboard')
  })

  it('keeps a session cookie a session cookie when a token refresh saves it again', async () => {
    await establishSessions(OPERATOR, { remember: false })

    const session = await getSession('dashboard')
    session.accessToken = 'rotated'
    await persistSession(session)

    expect(cookieStore.jar.get('spark_dashboard_session')?.options.maxAge).toBeUndefined()
    expect((await getSession('dashboard')).accessToken).toBe('rotated')
  })

  it('does not slide a remembered deadline forward when it is saved again', async () => {
    await establishSessions(OPERATOR, { remember: true })
    const session = await getSession('dashboard')
    const deadline = session.endsAt
    session.endsAt = Date.now() + 3 * 24 * 60 * 60 * 1000
    await persistSession(session)

    const maxAge = cookieStore.jar.get('spark_dashboard_session')?.options.maxAge as number
    expect(deadline).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000)
    expect(maxAge).toBeLessThanOrEqual(3 * 24 * 60 * 60)
  })

  it('treats a session past its deadline as signed out on the next read', async () => {
    await establishSessions(OPERATOR, { remember: false })
    const session = await getSession('dashboard')
    session.endsAt = Date.now() - 1000
    await persistSession(session)

    const reread = await getSession('dashboard')

    expect(reread.accessToken).toBeUndefined()
    expect(reread.user).toBeUndefined()
  })

  it('signs out an authenticated cookie that has no deadline instead of re-sealing it', async () => {
    await establishSessions(OPERATOR, { remember: true })
    const session = await getSession('dashboard')
    delete session.endsAt
    await session.save()

    const reread = await getSession('dashboard')

    expect(reread.accessToken).toBeUndefined()
  })

  it('keeps the original deadline when a plain save follows, without touching endsAt by hand', async () => {
    await establishSessions(OPERATOR, { remember: false })
    const first = await getSession('dashboard')
    const deadline = first.endsAt
    first.accessToken = 'rotated'
    await persistSession(first)

    expect((await getSession('dashboard')).endsAt).toBe(deadline)
  })

  it('refuses to save a session that was not read through getSession', async () => {
    const stray = { updateConfig: vi.fn(), save: vi.fn() } as unknown as Parameters<
      typeof persistSession
    >[0]

    await expect(persistSession(stray)).rejects.toThrow(/not read through getSession/)
    expect(stray.save).not.toHaveBeenCalled()
  })

  it('refuses to save a dashboard session that has no deadline', async () => {
    const session = await getSession('dashboard')
    session.accessToken = 'x'

    await expect(persistSession(session)).rejects.toThrow(/no deadline/)
  })

  it('gives a platform admin a 30 minute admin cookie with no remember flag, beside the dashboard one', async () => {
    await establishSessions(
      { ...OPERATOR, user: { ...OPERATOR.user, role: 'platform_admin' } },
      { remember: true },
    )

    const admin = cookieStore.jar.get('spark_platform_admin_session')?.options
    expect(admin?.maxAge).toBe(30 * 60)
    expect(admin?.path).toBe('/admin')
    const dashboard = await getSession('dashboard')
    expect(dashboard.remember).toBe(true)
    expect(dashboard.adminSessionExpiresAt).toBeGreaterThan(Date.now())
    const adminSession = await getSession('admin')
    expect(adminSession.remember).toBeUndefined()
    expect(adminSession.endsAt).toBeUndefined()
  })
})
