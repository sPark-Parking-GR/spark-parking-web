'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { NAV_ICONS } from '@/components/nav-icons'
import { useShellNav } from '@/components/ShellFrame'
import { isNavActive, type NavItem } from '@/lib/nav'

export function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const { rail, close } = useShellNav()
  const active = isNavActive(pathname, item.href)
  const Icon = NAV_ICONS[item.icon]
  const label = t(item.icon)

  return (
    <Link
      href={item.href}
      className="ds-navlink"
      aria-current={active ? 'page' : undefined}
      data-tooltip={rail ? label : undefined}
      data-tooltip-pos="right"
      onClick={close}
    >
      <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      <span className="ds-navlink__label">{label}</span>
    </Link>
  )
}
