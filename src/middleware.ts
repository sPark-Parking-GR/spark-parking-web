import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromRequest, isDashboardRole } from './lib/session'

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const res = NextResponse.next()
  const session = await getSessionFromRequest(req, res)

  if (!session.accessToken || !session.user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  if (!isDashboardRole(session.user.role)) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('error', 'forbidden')
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico|api/auth|.*\\..*).*)'],
}
