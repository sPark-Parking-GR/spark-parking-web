import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { TooltipLayer } from '@/components/TooltipLayer'
import { NumberWheelGuard } from '@/components/NumberWheelGuard'
import { getSession, isAuthenticated } from '@/lib/session'
import { navForPlatformAdmin } from '@/lib/nav'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession('admin')

  if (!isAuthenticated(session)) {
    redirect('/login')
  }
  if (session.user.role !== 'platform_admin') {
    redirect('/login?error=forbidden')
  }

  const items = navForPlatformAdmin()

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
