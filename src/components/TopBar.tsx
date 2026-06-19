import { SignOutButton } from '@/components/SignOutButton'
import type { AuthUser } from '@spark/types'

const ROLE_LABELS: Record<AuthUser['role'], string> = {
  guest: 'Guest',
  user: 'User',
  operator_staff: 'Operator staff',
  operator_admin: 'Operator admin',
  platform_admin: 'Platform admin',
}

export function TopBar({ user }: { user: AuthUser }) {
  const name = user.displayName ?? user.email

  return (
    <header className="topbar">
      <span className="topbar__title h-heading">Dashboard</span>
      <div className="topbar__user">
        <span className="topbar__identity">
          <span className="topbar__name">{name}</span>
          <span className="topbar__role text-secondary">{ROLE_LABELS[user.role]}</span>
        </span>
        <SignOutButton />
      </div>
    </header>
  )
}
