import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { TooltipLayer } from '@/components/TooltipLayer'
import { NumberWheelGuard } from '@/components/NumberWheelGuard'
import { isPlatformRole } from '@spark/types'
import { getSession, isAuthenticated, isDashboardRole } from '@/lib/session'
import { navForOperator, navForPlatformAdmin } from '@/lib/nav'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession('dashboard')

  if (!isAuthenticated(session) || !isDashboardRole(session.user.role)) {
    redirect('/login')
  }

  const items =
    isPlatformRole(session.user.role)
      ? navForPlatformAdmin(session.user.role)
      : navForOperator(session.user.role)

  return (
    <div className="dashboard-shell">
      <Sidebar items={items} role={session.user.role} />
      <div className="dashboard-main">
        <TopBar user={session.user} />
        <main className="dashboard-content">{children}</main>
      </div>
      <TooltipLayer />
      <NumberWheelGuard />
    </div>
  )
}
