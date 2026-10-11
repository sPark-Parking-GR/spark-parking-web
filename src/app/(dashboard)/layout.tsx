import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { DashboardShell } from '@/components/DashboardShell'
import { PageTransitionReveal } from '@/components/PageTransitionReveal'
import { isPlatformRole } from '@spark/types'
import { getSession, hasLapsedAdminWindow, isAuthenticated, isDashboardRole } from '@/lib/session'
import { navForOperator, navForPlatformAdmin } from '@/lib/nav'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession('dashboard')

  if (!isAuthenticated(session) || !isDashboardRole(session.user.role)) {
    redirect('/login')
  }

  // navForPlatformAdmin merges /dashboard and /admin/* into one sidebar for this tier, so
  // this shell must not render as authenticated once the shorter-lived /admin cookie has
  // lapsed — otherwise the sidebar's /admin links look usable right up until they're
  // clicked. See hasLapsedAdminWindow for why this can't just re-check the real cookie.
  if (isPlatformRole(session.user.role) && hasLapsedAdminWindow(session)) {
    redirect('/login')
  }

  const items = isPlatformRole(session.user.role)
    ? navForPlatformAdmin(session.user.role)
    : navForOperator(session.user.role)

  return (
    <DashboardShell items={items} user={session.user} extras={<PageTransitionReveal />}>
      {children}
    </DashboardShell>
  )
}
