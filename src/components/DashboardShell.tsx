import type { ReactNode } from 'react'
import { BottomTabBar } from '@/components/BottomTabBar'
import { NumberWheelGuard } from '@/components/NumberWheelGuard'
import { ShellFrame } from '@/components/ShellFrame'
import { Sidebar } from '@/components/Sidebar'
import { TooltipLayer } from '@/components/TooltipLayer'
import { TopBar } from '@/components/TopBar'
import { navModeFor, type NavItem } from '@/lib/nav'
import type { AuthUser } from '@spark/types'

interface DashboardShellProps {
  items: NavItem[]
  user: AuthUser
  extras?: ReactNode
  children: ReactNode
}

export function DashboardShell({ items, user, extras, children }: DashboardShellProps) {
  const navMode = navModeFor(items)

  return (
    <ShellFrame navMode={navMode}>
      <Sidebar items={items} role={user.role} />
      <div className="dashboard-main">
        <TopBar user={user} items={items} navMode={navMode} />
        <main className="dashboard-content">{children}</main>
      </div>
      {navMode === 'tabs' ? <BottomTabBar items={items} /> : null}
      <TooltipLayer />
      <NumberWheelGuard />
      {extras}
    </ShellFrame>
  )
}
