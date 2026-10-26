import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { DashboardShell } from '@/components/DashboardShell'
import { isPlatformRole } from '@spark/types'
import { getSession, isAuthenticated } from '@/lib/session'
import { requireLegalAcceptance } from '@/lib/legal-gate'
import { navForPlatformAdmin } from '@/lib/nav'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession('admin')

  if (!isAuthenticated(session)) {
    redirect('/login')
  }
  if (!isPlatformRole(session.user.role)) {
    redirect('/login?error=forbidden')
  }

  await requireLegalAcceptance()

  const items = navForPlatformAdmin(session.user.role)

  return (
    <DashboardShell items={items} user={session.user}>
      {children}
    </DashboardShell>
  )
}
