'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

  return (
    <Link
      href={item.href}
      className={`navlink${active ? ' navlink--active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <span className="navlink__icon" aria-hidden="true">
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  )
}
