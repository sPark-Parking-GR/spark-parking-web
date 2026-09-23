import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isPlatformRole } from '@spark/types'
import {
  clearLegacySessionFromRequest,
  getSessionFromRequest,
  hasLapsedAdminWindow,
  isDashboardRole,
} from './lib/session'

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const res = NextResponse.next()
  await clearLegacySessionFromRequest(req, res)
  const requiresPlatformAdmin = req.nextUrl.pathname.startsWith('/admin')
  const session = await getSessionFromRequest(
    req,
    res,
    requiresPlatformAdmin ? 'admin' : 'dashboard',
  )

  if (!session.accessToken || !session.user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  const allowed = requiresPlatformAdmin
    ? isPlatformRole(session.user.role)
    : isDashboardRole(session.user.role)

  if (!allowed) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('error', 'forbidden')
    return NextResponse.redirect(loginUrl)
  }

  // Mirrors the check in (dashboard)/layout.tsx: for a platform-tier role, /dashboard must
  // not pass once the separately-issued /admin cookie has hit its own, much shorter TTL —
  // see hasLapsedAdminWindow for why this reads a shadow field on the dashboard session
  // rather than the real /admin cookie (Path scoping means this request never carries it).
  if (
    !requiresPlatformAdmin &&
    isPlatformRole(session.user.role) &&
    hasLapsedAdminWindow(session)
  ) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

// WHY: session cookies are scoped to /dashboard and /admin, so no other path can carry
// one — matching them here would redirect authenticated users to /login. The root page is
// a bare redirect into /dashboard, where this guard applies.
export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/admin', '/admin/:path*'],
}
