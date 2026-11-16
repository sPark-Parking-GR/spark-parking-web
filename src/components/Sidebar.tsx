'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CollapseButton, DrawerCloseButton } from '@/components/NavDrawerControls'
import { LegalFooterLinks } from '@/components/LegalConsent'
import { NavLink } from '@/components/NavLink'
import { SIDEBAR_ID } from '@/components/ShellFrame'
import { SignOutButton } from '@/components/SignOutButton'
import { SparkMark } from '@/components/SparkMark'
import { groupNavItems, type NavItem } from '@/lib/nav'
import type { ShellAccount } from '@/lib/shell-account'

interface SidebarProps {
  items: NavItem[]
  account: ShellAccount
  isPlatform: boolean
}

export function Sidebar({ items, account, isPlatform }: SidebarProps) {
  const shell = useTranslations('shell')
  const nav = useTranslations('nav')

  return (
    <aside id={SIDEBAR_ID} className="ds-sidebar">
      <div className="ds-sidebar__head">
        <Link href="/dashboard" className="ds-brand" aria-label="sPark">
          <SparkMark size={22} title="sPark" gradientId="spark-sidebar-grad" />
          <b aria-hidden="true">sPark</b>
        </Link>
        {/* An operator is not an administrator of the platform, and labelling their own
            dashboard "Admin" reads as if they wandered into the wrong product. */}
        <span className="ds-pill">
          {isPlatform ? shell('brandTag') : shell('brandTagOperator')}
        </span>
        <DrawerCloseButton />
      </div>
      <nav className="ds-sidebar__nav" aria-label={shell('primaryNav')}>
        {groupNavItems(items).map((group) => (
          <div
            key={group.id}
            role="group"
            className="ds-group"
            aria-labelledby={`ds-group-${group.id}`}
          >
            <div id={`ds-group-${group.id}`} className="ds-group__title">
              {nav(`groups.${group.id}`)}
            </div>
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        ))}
      </nav>
      <div className="ds-sidebar__foot">
        <div className="ds-me">
          <Link href="/dashboard/profile" className="ds-me__link" data-tooltip={account.email}>
            <span className="ds-avatar" aria-hidden="true">
              {account.initials}
            </span>
            <span className="ds-me__text">
              <b>{account.name}</b>
              <small>{account.roleLabel}</small>
            </span>
          </Link>
          <SignOutButton />
        </div>
        <CollapseButton />
        <div className="ds-sidebar__legal">
          <LegalFooterLinks />
        </div>
      </div>
    </aside>
  )
}
