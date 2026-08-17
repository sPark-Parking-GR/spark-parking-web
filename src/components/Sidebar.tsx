import { getTranslations } from 'next-intl/server'
import { NavLink } from '@/components/NavLink'
import { SparkLogo } from '@/components/SparkLogo'
import type { NavItem } from '@/lib/nav'
import { isPlatformRole, type UserRole } from '@spark/types'

export async function Sidebar({ items, role }: { items: NavItem[]; role: UserRole }) {
  const t = await getTranslations('shell')
  const showPromo = !isPlatformRole(role)

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
      {showPromo ? (
        <div className="sidebar__promo">
          <div className="sidebar__promo-title">{t('upgradeTitle')}</div>
          <div className="sidebar__promo-sub">{t('upgradeSub')}</div>
          <button type="button" className="sidebar__promo-cta" disabled>
            {t('upgradeCta')}
          </button>
        </div>
      ) : null}
    </aside>
  )
}
