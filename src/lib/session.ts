import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import type { IronSession, SessionOptions } from 'iron-session'
import type { NextRequest, NextResponse } from 'next/server'
import { isPlatformRole, type AuthUser, type UserRole } from '@spark/types'

export interface SessionData {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: AuthUser
  /**
   * Only set on the dashboard-scoped cookie, and only for platform-tier roles: the wall-clock
   * time the separately-issued /admin cookie will hit its ADMIN_TTL_SECONDS absolute expiry.
   *
   * navForPlatformAdmin merges /dashboard and /admin/* into one sidebar, but the two scopes
   * are separate cookies with very different lifetimes (14 days vs. 30 minutes), and Path
   * scoping means a /dashboard request never carries the /admin cookie — there is no way to
   * read its real state from here. Without this shadow value, /dashboard keeps rendering as
   * fully authenticated long after the admin cookie has lapsed, and the merged sidebar's
   * /admin links only reveal that the moment they're clicked. Mirroring the same absolute
   * deadline here (set once at login, alongside the real cookie, in establishSessions) lets
   * the dashboard shell itself bounce to /login instead of presenting a half-authenticated
   * surface.
   */
  adminSessionExpiresAt?: number
}

export type SessionScope = 'dashboard' | 'admin'

const DASHBOARD_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  'operator_staff',
  'operator_admin',
  'platform_admin',
  'super_admin',
])

export function isDashboardRole(role: UserRole | undefined): boolean {
  return role !== undefined && DASHBOARD_ROLES.has(role)
}

function getSessionPassword(): string {
  const password = process.env['SESSION_SECRET']
  if (!password || password.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters long')
  }
  return password
}

const sessionPassword = getSessionPassword()

const DASHBOARD_TTL_SECONDS = 14 * 24 * 60 * 60
const ADMIN_TTL_SECONDS = 30 * 60

export const dashboardSessionOptions: SessionOptions = {
  cookieName: 'spark_dashboard_session',
  password: sessionPassword,
  ttl: DASHBOARD_TTL_SECONDS,
  cookieOptions: {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path: '/dashboard',
  },
}

// WHY: `ttl` bounds the encrypted seal server-side while `maxAge` bounds the cookie in
// the browser; iron-session only derives one from the other when `maxAge` is absent, so
// both are pinned to 30 minutes here to keep the admin surface expiring on schedule even
// if a copied cookie is replayed.
//
// WHY this name, not `spark_admin_session`: that was the pre-split cookie's name, shared
// by every dashboard role at path `/`. Any browser with a session from before the split
// still carries that cookie. Reusing the name here — even with a narrower path — means a
// browser can hold two same-named cookies at once (old path `/`, new path `/admin`), and
// header-parsing order then decides which one wins; that ambiguity is what caused
// platform_admin to get bounced to /login when the stale one won. A distinct name makes
// the collision impossible instead of relying on parser behavior.
export const adminSessionOptions: SessionOptions = {
  cookieName: 'spark_platform_admin_session',
  password: sessionPassword,
  ttl: ADMIN_TTL_SECONDS,
  cookieOptions: {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: ADMIN_TTL_SECONDS,
  },
}

// The pre-split cookie every dashboard role used to share, at path `/`. Nothing issues
// it anymore, but nothing ever cleared it from existing browsers either — clear it
// opportunistically on every login so it stops shadowing the new admin cookie above.
export const legacySessionOptions: SessionOptions = {
  cookieName: 'spark_admin_session',
  password: sessionPassword,
  cookieOptions: {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path: '/',
  },
}

const optionsByScope: Readonly<Record<SessionScope, SessionOptions>> = {
  dashboard: dashboardSessionOptions,
  admin: adminSessionOptions,
}

export async function getSession(scope: SessionScope): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, optionsByScope[scope])
}

// WHY: iron-session v8 uses the Web Crypto API and is edge-compatible, so the
// same getIronSession can read the cookie in middleware via the (req, res) overload.
export function getSessionFromRequest(
  req: NextRequest,
  res: NextResponse,
  scope: SessionScope,
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, optionsByScope[scope])
}

// WHY: middleware runs on every /dashboard and /admin request, so the legacy cookie is
// checked for presence before iron-session is even constructed — the common case (no
// legacy cookie) stays a single cheap lookup instead of paying for a seal/unseal.
export async function clearLegacySessionFromRequest(
  req: NextRequest,
  res: NextResponse,
): Promise<void> {
  if (!req.cookies.get(legacySessionOptions.cookieName)) return
  const legacySession = await getIronSession<SessionData>(req, res, legacySessionOptions)
  legacySession.destroy()
}

// WHY: the two cookies are path-scoped, so a request carries at most one of them —
// admin pages get the admin cookie, dashboard pages the dashboard one. Shared
// data-access code cannot know its surface, so it resolves whichever cookie arrived;
// probe order doesn't matter for correctness since only one is ever actually present,
// dashboard is just the more common case.
export async function getActiveSession(): Promise<IronSession<SessionData>> {
  const dashboardSession = await getSession('dashboard')
  if (isAuthenticated(dashboardSession)) return dashboardSession
  return getSession('admin')
}

export async function setSession(scope: SessionScope, data: SessionData): Promise<void> {
  const session = await getSession(scope)
  session.accessToken = data.accessToken
  session.refreshToken = data.refreshToken
  session.expiresAt = data.expiresAt
  session.user = data.user
  if (data.adminSessionExpiresAt === undefined) delete session.adminSessionExpiresAt
  else session.adminSessionExpiresAt = data.adminSessionExpiresAt
  await session.save()
}

export async function clearSession(scope: SessionScope): Promise<void> {
  const session = await getSession(scope)
  session.destroy()
}

export async function establishSessions(data: SessionData): Promise<void> {
  const isPlatformTier = isPlatformRole(data.user.role)
  await setSession('dashboard', {
    ...data,
    adminSessionExpiresAt: isPlatformTier ? Date.now() + ADMIN_TTL_SECONDS * 1000 : undefined,
  })
  if (isPlatformTier) {
    await setSession('admin', data)
  }
  const cookieStore = await cookies()
  const legacySession = await getIronSession<SessionData>(cookieStore, legacySessionOptions)
  legacySession.destroy()
}

/**
 * Patches the user snapshot the session cookie carries, on whichever cookie arrived.
 *
 * The topbar and every `requireSession()` caller read the user from the cookie, not from
 * the API, so a profile change made against the database would otherwise stay invisible
 * until the session was next established — up to fourteen days for the dashboard cookie.
 * Deliberately narrow: it patches the snapshot, it does not re-authenticate.
 */
export async function refreshSessionUser(
  patch: Partial<Omit<AuthUser, 'displayName'>> & { displayName?: string | null },
): Promise<void> {
  for (const scope of ['dashboard', 'admin'] as const) {
    const session = await getSession(scope)
    if (!isAuthenticated(session)) continue
    const { displayName, ...rest } = patch
    session.user = { ...session.user, ...rest }
    // A null name means "no name": leaving the old key in place would keep rendering it.
    if (displayName === null) delete session.user.displayName
    else if (displayName !== undefined) session.user.displayName = displayName
    await session.save()
  }
}

export async function clearAllSessions(): Promise<void> {
  await clearSession('dashboard')
  await clearSession('admin')
  const cookieStore = await cookies()
  const legacySession = await getIronSession<SessionData>(cookieStore, legacySessionOptions)
  legacySession.destroy()
}

export function isAuthenticated(session: IronSession<SessionData>): boolean {
  return Boolean(session.accessToken) && session.user !== undefined
}

// For a platform-tier role reading its *dashboard* session: whether the /admin cookie set
// alongside it at login has passed its own, separately-tracked expiry. See
// `adminSessionExpiresAt` on SessionData for why this can't just re-check the real cookie.
export function hasLapsedAdminWindow(session: IronSession<SessionData>): boolean {
  return session.adminSessionExpiresAt === undefined || Date.now() >= session.adminSessionExpiresAt
}
