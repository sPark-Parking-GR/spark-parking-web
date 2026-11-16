'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isNavActive, type NavItem } from '@/lib/nav'

// On a phone the header has no room for the subtitle, so it names the page instead.
export function TopBarTitle({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const nav = useTranslations('nav')
  const shell = useTranslations('shell')
  const current = items.find((item) => isNavActive(pathname, item.href))

  return <b className="ds-title__page">{current ? nav(current.icon) : shell('title')}</b>
}
