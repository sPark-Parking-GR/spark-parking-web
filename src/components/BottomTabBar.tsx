'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { NAV_ICONS } from '@/components/nav-icons'
import { isNavActive, type NavItem } from '@/lib/nav'

export function BottomTabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const shell = useTranslations('shell')

  return (
    <nav className="tabbar" aria-label={shell('primaryNav')}>
      {items.map((item) => {
        const active = isNavActive(pathname, item.href)
        const Icon = NAV_ICONS[item.icon]
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`tabbar__item${active ? ' tabbar__item--active' : ''}${
              item.icon === 'scan' ? ' tabbar__item--primary' : ''
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="tabbar__icon" aria-hidden="true">
              <Icon size={22} strokeWidth={2} />
            </span>
            <span className="tabbar__label">{t(item.icon)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
