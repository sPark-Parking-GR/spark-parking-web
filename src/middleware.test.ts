import { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

const getSessionFromRequest = vi.hoisted(() => vi.fn())
const clearLegacySessionFromRequest = vi.hoisted(() => vi.fn())

vi.mock('./lib/session', () => ({
  clearLegacySessionFromRequest,
  getSessionFromRequest,
  hasLapsedAdminWindow: () => false,
  isDashboardRole: () => true,
}))

import { middleware } from './middleware'

describe('middleware', () => {
  it('carries the cookie-clearing header onto the login redirect for an expired session', async () => {
    getSessionFromRequest.mockImplementation(async (_req: NextRequest, res: NextResponse) => {
      res.headers.append(
        'set-cookie',
        'spark_dashboard_session=; Path=/dashboard; Max-Age=0; HttpOnly',
      )
      return {}
    })

    const response = await middleware(new NextRequest('http://localhost:3000/dashboard/bookings'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login?from=%2Fdashboard%2Fbookings')
    expect(response.headers.getSetCookie()).toEqual([
      'spark_dashboard_session=; Path=/dashboard; Max-Age=0; HttpOnly',
    ])
  })
})
