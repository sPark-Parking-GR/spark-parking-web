import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { NavLink } from '@/components/NavLink'
import { SparkLogo } from '@/components/SparkLogo'
import type { NavItem } from '@/lib/nav'
import { isPlatformRole, type UserRole } from '@spark/types'

export async function Sidebar({ items, role }: { items: NavItem[]; role: UserRole }) {
  const t = await getTranslations('shell')
  const isPlatform = isPlatformRole(role)
  const showPromo = !isPlatform

  return (
    <aside className="sidebar" data-theme="dark">
      <div className="sidebar__brand">
        {/* An operator is not an administrator of the platform, and labelling their own
            dashboard "Admin" reads as if they wandered into the wrong product. */}
        <SparkLogo
          label={isPlatform ? t('brandTag') : t('brandTagOperator')}
          onInk
          gradientId="spark-sidebar-grad"
        />
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
          {/* Was a disabled button, which read as "upgrades are unavailable" while the
              billing page offered self-serve checkout two clicks away. */}
          <Link href="/dashboard/billing" className="sidebar__promo-cta">
            {t('upgradeCta')}
          </Link>
        </div>
      ) : null}
    </aside>
  )
}
