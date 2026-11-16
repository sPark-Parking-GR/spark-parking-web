import Link from 'next/link'
import { Search } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { MenuButton } from '@/components/NavDrawerControls'
import { TopBarTitle } from '@/components/TopBarTitle'
import { SignOutButton } from '@/components/SignOutButton'
import { LanguageSwitch } from '@/components/LanguageSwitch'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { NavItem } from '@/lib/nav'
import type { ShellAccount } from '@/lib/shell-account'

interface TopBarProps {
  account: ShellAccount
  items: NavItem[]
  isPlatform: boolean
}

export async function TopBar({ account, items, isPlatform }: TopBarProps) {
  const t = await getTranslations('shell')
  const subtitle = isPlatform ? t('subtitlePlatform') : t('subtitleOperator')

  return (
    <header className="ds-header">
      <MenuButton />
      <div className="ds-title">
        <b className="ds-title__main">{t('title')}</b>
        <TopBarTitle items={items} />
        <small>{subtitle}</small>
      </div>
      <div className="ds-spacer" />
      <div className="ds-search" aria-disabled="true" data-tooltip={t('searchComingSoon')}>
        <Search size={18} strokeWidth={1.8} aria-hidden="true" />
        <span>{t('searchLabel')}</span>
        <kbd>{t('soon')}</kbd>
      </div>
      <button
        type="button"
        className="ds-ibtn ds-search-btn"
        aria-disabled="true"
        aria-label={t('searchComingSoon')}
        data-tooltip={t('searchComingSoon')}
        data-tooltip-pos="bottom"
      >
        <Search size={20} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <LanguageSwitch />
      <ThemeToggle />
      <span className="ds-vsep" aria-hidden="true" />
      {/* The identity chip is where someone looks for "that is not my name" — so it is
          the link to the page that fixes it, rather than a nav item competing with the
          operator's actual work. */}
      <Link
        href="/dashboard/profile"
        className="ds-who"
        aria-label={t('signedInAs', { name: account.name })}
        data-tooltip={account.email}
        data-tooltip-pos="bottom"
      >
        <span className="ds-who__text">
          <b>{account.name}</b>
          <small>{account.roleLabel}</small>
        </span>
        <span className="ds-avatar" aria-hidden="true">
          {account.initials}
        </span>
      </Link>
      <span className="ds-signout-slot">
        <SignOutButton />
      </span>
      <div className="ds-progress" aria-hidden="true" />
    </header>
  )
}
