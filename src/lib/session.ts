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
   * are separate cookies with very different lifetimes (7 days vs. 30 minutes), and Path
   * scoping means a /dashboard request never carries the /admin cookie — there is no way to
   * read its real state from here. Without this shadow value, /dashboard keeps rendering as
   * fully authenticated long after the admin cookie has lapsed, and the merged sidebar's
   * /admin links only reveal that the moment they're clicked. Mirroring the same absolute
   * deadline here (set once at login, alongside the real cookie, in establishSessions) lets
   * the dashboard shell itself bounce to /login instead of presenting a half-authenticated
   * surface.
   */
  adminSessionExpiresAt?: number
  /**
   * Dashboard cookie only. Whether the person ticked "keep me signed in". Absent on cookies
   * issued before the option existed, which read as remembered.
   */
  remember?: boolean
  /**
   * Dashboard cookie only: the wall-clock moment the session is over, fixed at sign-in and never
   * extended by a token refresh. A browser-session cookie is sealed without an expiry (iron-session
   * has no other way to leave `Max-Age` off), so this is the only server-side bound it has —
   * enforced by expireIfPastDeadline on every read.
   */
  endsAt?: number
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

// WHY a getter, not a value computed once at module load: Next's build-time page-data
// collection imports every route's module graph to inspect config/metadata, without ever
// calling getSession(). CI deliberately never provides SESSION_SECRET at build time (only
// NEXT_PUBLIC_* are needed then — see the CI workflow), so an eager module-level throw
// here fails the build itself. Deferring to a getter means iron-session only reads
// `.password` — and this only throws — when a request actually opens or seals a session.
function getSessionPassword(): string {
  const password = process.env['SESSION_SECRET']
  if (!password || password.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters long')
  }
  return password
}

// Ticking "keep me signed in" buys a week; leaving it unticked ends the session when the browser
// closes, and in any case after twelve hours, so a restored browser session or a shared machine
// that never quits cannot hold a sign-in open indefinitely.
const REMEMBERED_TTL_SECONDS = 7 * 24 * 60 * 60
const UNREMEMBERED_TTL_SECONDS = 12 * 60 * 60
const ADMIN_TTL_SECONDS = 30 * 60
// iron-session derives the cookie's Max-Age as ttl minus a 60 second skew and reads ttl 0 as
// "never expires", so a remaining lifetime is floored above both.
const MIN_SEAL_TTL_SECONDS = 61

export const dashboardSessionOptions: SessionOptions = {
  cookieName: 'spark_dashboard_session',
  get password() {
    return getSessionPassword()
  },
  ttl: REMEMBERED_TTL_SECONDS,
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
  get password() {
    return getSessionPassword()
  },
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
  get password() {
    return getSessionPassword()
  },
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

// Which cookie a session object was read from, so a later save re-seals it with that cookie's own
// lifetime rules rather than the read-time defaults.
const scopeBySession = new WeakMap<object, SessionScope>()

export function sessionDeadline(remember: boolean, now: number = Date.now()): number {
  return now + (remember ? REMEMBERED_TTL_SECONDS : UNREMEMBERED_TTL_SECONDS) * 1000
}

/**
 * The options a dashboard session must be saved with: a remembered one is sealed for whatever is
 * left of its fixed week (so refreshing a token never slides the deadline), an unremembered one
 * gets no `maxAge` at all, which is what makes the browser drop the cookie when it closes.
 */
export function optionsForSession(
  scope: SessionScope,
  data: Pick<SessionData, 'remember' | 'endsAt'>,
  now: number = Date.now(),
): SessionOptions {
  if (scope === 'admin') return adminSessionOptions
  const remember = data.remember ?? true
  if (!remember) {
    return {
      ...dashboardSessionOptions,
      cookieOptions: { ...dashboardSessionOptions.cookieOptions, maxAge: undefined },
    }
  }
  const endsAt = data.endsAt ?? sessionDeadline(true, now)
  const remaining = Math.floor((endsAt - now) / 1000)
  return { ...dashboardSessionOptions, ttl: Math.max(MIN_SEAL_TTL_SECONDS, remaining) }
}

/**
 * Signs out a dashboard session that is past its deadline — or that never had one. A cookie
 * issued before `endsAt` existed is still sealed for its original fourteen days; leaving it
 * alone would let a token refresh re-seal it for a further week, so it costs one re-login instead.
 */
export function expireIfPastDeadline(
  session: Partial<Pick<SessionData, 'accessToken' | 'endsAt'>> &
    Pick<IronSession<SessionData>, 'destroy'>,
  scope: SessionScope,
  now: number = Date.now(),
): void {
  if (scope !== 'dashboard') return
  const missingDeadline = Boolean(session.accessToken) && session.endsAt === undefined
  const pastDeadline = session.endsAt !== undefined && now >= session.endsAt
  if (!missingDeadline && !pastDeadline) return
  try {
    session.destroy()
  } catch {
    // Read-only render context: destroy has already emptied the session in memory, but the
    // cookie cannot be cleared here. It is cleared by the next request through the middleware,
    // which forwards the header on its redirect.
  }
}

export async function getSession(scope: SessionScope): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, optionsByScope[scope])
  scopeBySession.set(session, scope)
  expireIfPastDeadline(session, scope)
  return session
}

export async function persistSession(session: IronSession<SessionData>): Promise<void> {
  const scope = scopeBySession.get(session)
  // Never guess: saving an admin-scope session with dashboard options would rename its cookie
  // and turn a 30 minute token into a week-long one.
  if (scope === undefined)
    throw new Error('persistSession: session was not read through getSession')
  if (scope === 'dashboard' && session.endsAt === undefined) {
    throw new Error('persistSession: dashboard session has no deadline')
  }
  session.updateConfig(optionsForSession(scope, session))
  await session.save()
}

// WHY: iron-session v8 uses the Web Crypto API and is edge-compatible, so the
// same getIronSession can read the cookie in middleware via the (req, res) overload.
export async function getSessionFromRequest(
  req: NextRequest,
  res: NextResponse,
  scope: SessionScope,
): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(req, res, optionsByScope[scope])
  scopeBySession.set(session, scope)
  expireIfPastDeadline(session, scope)
  return session
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
  if (data.remember === undefined) delete session.remember
  else session.remember = data.remember
  if (data.endsAt === undefined) delete session.endsAt
  else session.endsAt = data.endsAt
  await persistSession(session)
}

export async function clearSession(scope: SessionScope): Promise<void> {
  const session = await getSession(scope)
  session.destroy()
}

export async function establishSessions(
  data: Omit<SessionData, 'remember' | 'endsAt'>,
  { remember }: { remember: boolean },
): Promise<void> {
  const isPlatformTier = isPlatformRole(data.user.role)
  await setSession('dashboard', {
    ...data,
    adminSessionExpiresAt: isPlatformTier ? Date.now() + ADMIN_TTL_SECONDS * 1000 : undefined,
    remember,
    endsAt: sessionDeadline(remember),
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
 * until the session was next established — up to a week for the dashboard cookie.
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
    await persistSession(session)
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
