import { getTranslations } from 'next-intl/server'
import { NavLink } from '@/components/NavLink'
import { DrawerCloseButton, SIDEBAR_ID } from '@/components/NavDrawerControls'
import { SparkLogo } from '@/components/SparkLogo'
import type { NavItem } from '@/lib/nav'
import { isPlatformRole, type UserRole } from '@spark/types'

export async function Sidebar({ items, role }: { items: NavItem[]; role: UserRole }) {
  const t = await getTranslations('shell')
  const isPlatform = isPlatformRole(role)

  return (
    <aside id={SIDEBAR_ID} className="sidebar" data-theme="dark">
      <div className="sidebar__brand">
        {/* An operator is not an administrator of the platform, and labelling their own
            dashboard "Admin" reads as if they wandered into the wrong product. */}
        <SparkLogo
          label={isPlatform ? t('brandTag') : t('brandTagOperator')}
          onInk
          gradientId="spark-sidebar-grad"
        />
        <DrawerCloseButton />
      </div>
      <nav className="sidebar__nav" aria-label={t('primaryNav')}>
        {items.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  )
}
