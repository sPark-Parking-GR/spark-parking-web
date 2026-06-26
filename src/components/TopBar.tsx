import { SignOutButton } from '@/components/SignOutButton'
import type { AuthUser } from '@spark/types'

const ROLE_LABELS: Record<AuthUser['role'], string> = {
  guest: 'Guest',
  user: 'User',
  operator_staff: 'Operator staff',
  operator_admin: 'Operator admin',
  platform_admin: 'Platform admin',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]
  if (!first) return '?'
  const last = parts[parts.length - 1]
  if (parts.length === 1 || !last) return first.slice(0, 2).toUpperCase()
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase()
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
        <span
          className="topbar__avatar"
          data-tooltip={user.email}
          tabIndex={0}
          aria-label={`Signed in as ${name}`}
        >
          {initials(name)}
        </span>
        <SignOutButton />
      </div>
    </header>
  )
}
