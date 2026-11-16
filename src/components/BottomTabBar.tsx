'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { NAV_ICONS } from '@/components/nav-icons'
import { SIDEBAR_ID, useShellNav } from '@/components/ShellFrame'
import { isNavActive, type NavItem } from '@/lib/nav'

export function BottomTabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const nav = useTranslations('nav')
  const shell = useTranslations('shell')
  const { open, openMenu } = useShellNav()

  return (
    <nav className="ds-tabbar" aria-label={shell('quickNav')}>
      {items.map((item) => {
        const active = isNavActive(pathname, item.href)
        const Icon = NAV_ICONS[item.icon]
        const isScan = item.icon === 'scan'
        const icon = <Icon size={isScan ? 24 : 22} strokeWidth={1.8} aria-hidden="true" />
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`ds-tab${isScan ? ' ds-tab--scan' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {isScan ? <span className="ds-tab__fab">{icon}</span> : icon}
            <span>{item.icon === 'overview' ? shell('tabHome') : nav(item.icon)}</span>
          </Link>
        )
      })}
      <button
        type="button"
        className="ds-tab"
        aria-expanded={open}
        aria-controls={SIDEBAR_ID}
        onClick={(event) => openMenu(event.currentTarget)}
      >
        <Menu size={22} strokeWidth={1.8} aria-hidden="true" />
        <span>{shell('tabMenu')}</span>
      </button>
    </nav>
  )
}
