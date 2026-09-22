import Link from 'next/link'
import { Bell, Search } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { SignOutButton } from '@/components/SignOutButton'
import { LanguageSwitch } from '@/components/LanguageSwitch'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { AuthUser } from '@spark/types'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]
  if (!first) return '?'
  const last = parts[parts.length - 1]
  if (parts.length === 1 || !last) return first.slice(0, 2).toUpperCase()
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase()
}

export async function TopBar({ user }: { user: AuthUser }) {
  const t = await getTranslations('shell')
  const name = user.displayName ?? user.email
  const subtitle =
    user.role === 'platform_admin' || user.role === 'super_admin'
      ? t('subtitlePlatform')
      : t('subtitleOperator')

  const ROLE_LABELS: Record<AuthUser['role'], string> = {
    guest: t('roleGuest'),
    user: t('roleUser'),
    operator_staff: t('roleOperatorStaff'),
    operator_admin: t('roleOperatorAdmin'),
    platform_admin: t('rolePlatformAdmin'),
    super_admin: t('roleSuperAdmin'),
  }

  return (
    <header className="topbar">
      <span className="topbar__titles">
        <span className="topbar__title h-heading">{t('title')}</span>
        <span className="topbar__subtitle">{subtitle}</span>
      </span>
      <div className="topbar__user">
        <div className="topbar__controls">
          <LanguageSwitch />
          <ThemeToggle />
        </div>
        <div className="topbar__search" data-tooltip={t('searchComingSoon')}>
          <Search size={16} strokeWidth={2} className="topbar__search-icon" aria-hidden="true" />
          <input
            className="topbar__search-input"
            type="search"
            placeholder={t('searchComingSoon')}
            aria-label={t('searchComingSoon')}
            disabled
          />
        </div>
        <button type="button" className="topbar__bell" aria-label={t('notifications')}>
          <Bell size={17} strokeWidth={2} aria-hidden="true" />
          <span className="topbar__bell-dot" aria-hidden="true" />
        </button>
        <span className="topbar__divider" aria-hidden="true" />
        {/* The identity chip is where someone looks for "that is not my name" — so it is
            the link to the page that fixes it, rather than a nav item competing with the
            operator's actual work. */}
        <Link href="/dashboard/profile" className="topbar__account" data-tooltip={user.email}>
          <span className="topbar__identity">
            <span className="topbar__name">{name}</span>
            <span className="topbar__role">{ROLE_LABELS[user.role]}</span>
          </span>
          <span className="topbar__avatar" aria-label={t('signedInAs', { name })}>
            {initials(name)}
          </span>
        </Link>
        <SignOutButton />
      </div>
    </header>
  )
}
