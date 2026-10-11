'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isNavActive, type NavItem } from '@/lib/nav'

export function TopBarTitle({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const nav = useTranslations('nav')
  const shell = useTranslations('shell')
  const current = items.find((item) => isNavActive(pathname, item.href))

  return (
    <span className="topbar__page h-heading">{current ? nav(current.icon) : shell('title')}</span>
  )
}
