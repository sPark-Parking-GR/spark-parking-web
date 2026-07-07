import { getTranslations } from 'next-intl/server'
import { NavLink } from '@/components/NavLink'
import { SparkLogo } from '@/components/SparkLogo'
import type { NavItem } from '@/lib/nav'

export async function Sidebar({ items }: { items: NavItem[] }) {
  const t = await getTranslations('shell')

  return (
    <aside className="sidebar" data-theme="dark">
      <div className="sidebar__brand">
        <SparkLogo label={t('brandTag')} onInk gradientId="spark-sidebar-grad" />
      </div>
      <nav className="sidebar__nav" aria-label={t('primaryNav')}>
        {items.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  )
}
