import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import type { IronSession, SessionOptions } from 'iron-session'
import type { NextRequest, NextResponse } from 'next/server'
import type { AuthUser, UserRole } from '@spark/types'

export interface SessionData {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: AuthUser
}

const DASHBOARD_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  'operator_staff',
  'operator_admin',
  'platform_admin',
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

export const sessionOptions: SessionOptions = {
  cookieName: 'spark_admin_session',
  password: getSessionPassword(),
  cookieOptions: {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path: '/',
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

// WHY: iron-session v8 uses the Web Crypto API and is edge-compatible, so the
// same getIronSession can read the cookie in middleware via the (req, res) overload.
export function getSessionFromRequest(
  req: NextRequest,
  res: NextResponse,
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, sessionOptions)
}

export async function setSession(data: SessionData): Promise<void> {
  const session = await getSession()
  session.accessToken = data.accessToken
  session.refreshToken = data.refreshToken
  session.expiresAt = data.expiresAt
  session.user = data.user
  await session.save()
}

export async function clearSession(): Promise<void> {
  const session = await getSession()
  session.destroy()
}

export function isAuthenticated(session: IronSession<SessionData>): boolean {
  return Boolean(session.accessToken) && session.user !== undefined
}
