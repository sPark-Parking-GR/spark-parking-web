import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { BottomTabBar } from '@/components/BottomTabBar'
import { DashboardLoadingProvider } from '@/components/DashboardLoading'
import { NumberWheelGuard } from '@/components/NumberWheelGuard'
import { ShellFrame } from '@/components/ShellFrame'
import { Sidebar } from '@/components/Sidebar'
import { TooltipLayer } from '@/components/TooltipLayer'
import { TopBar } from '@/components/TopBar'
import { tabItemsFor, type NavItem } from '@/lib/nav'
import { initialsOf } from '@/lib/shell-account'
import { isPlatformRole } from '@spark/types'
import type { AuthUser } from '@spark/types'

interface DashboardShellProps {
  items: NavItem[]
  user: AuthUser
  extras?: ReactNode
  children: ReactNode
}

export async function DashboardShell({ items, user, extras, children }: DashboardShellProps) {
  const t = await getTranslations('shell')
  const name = user.displayName ?? user.email
  const roleLabels: Record<AuthUser['role'], string> = {
    guest: t('roleGuest'),
    user: t('roleUser'),
    operator_staff: t('roleOperatorStaff'),
    operator_admin: t('roleOperatorAdmin'),
    platform_admin: t('rolePlatformAdmin'),
    super_admin: t('roleSuperAdmin'),
  }
  const account = {
    name,
    email: user.email,
    roleLabel: roleLabels[user.role],
    initials: initialsOf(name),
  }
  const isPlatform = isPlatformRole(user.role)

  return (
    <DashboardLoadingProvider>
      <ShellFrame>
        <Sidebar items={items} account={account} isPlatform={isPlatform} />
        <div className="dashboard-main" data-shell-main>
          <TopBar account={account} items={items} isPlatform={isPlatform} />
          <div className="dashboard-scroll">
            <div className="dashboard-glow" aria-hidden="true" />
            <main className="dashboard-content">{children}</main>
          </div>
          <BottomTabBar items={tabItemsFor(items)} />
        </div>
        <TooltipLayer />
        <NumberWheelGuard />
        {extras}
      </ShellFrame>
    </DashboardLoadingProvider>
  )
}
