'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ICONS } from '@/components/nav-icons'
import type { NavItem } from '@/lib/nav'

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active = isActive(pathname, item.href)
  const Icon = NAV_ICONS[item.icon]

  return (
    <Link
      href={item.href}
      className={`navlink${active ? ' navlink--active' : ''}`}
      aria-current={active ? 'page' : undefined}
      data-tooltip={item.description}
      data-tooltip-pos="right"
    >
      <span className="navlink__icon" aria-hidden="true">
        <Icon size={19} strokeWidth={2} />
      </span>
      <span className="navlink__label">{item.label}</span>
    </Link>
  )
}
