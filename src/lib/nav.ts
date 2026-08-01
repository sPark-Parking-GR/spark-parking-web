import { hasPlatformPermission } from '@spark/types'
import type { PlatformPermission, UserRole } from '@spark/types'

export type NavIcon =
  | 'overview'
  | 'facilities'
  | 'tariffs'
  | 'bookings'
  | 'scan'
  | 'operators'
  | 'onboarding'
  | 'analytics'
  | 'audit'
  | 'trash'
  | 'approvals'

export interface NavItem {
  href: string
  icon: NavIcon
  roles: UserRole[]
  /** Extra gate beyond `roles`, checked with `hasPlatformPermission`. Omit when role alone decides. */
  permission?: PlatformPermission
}

const OPERATOR_ROLES: UserRole[] = ['operator_staff', 'operator_admin', 'platform_admin']
const OPERATOR_ADMIN_ROLES: UserRole[] = ['operator_admin', 'platform_admin']
const PLATFORM_ADMIN_ROLES: UserRole[] = ['platform_admin']

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: 'overview', roles: OPERATOR_ROLES },
  { href: '/dashboard/facilities', icon: 'facilities', roles: OPERATOR_ADMIN_ROLES },
  { href: '/dashboard/tariffs', icon: 'tariffs', roles: OPERATOR_ADMIN_ROLES },
  { href: '/dashboard/bookings', icon: 'bookings', roles: OPERATOR_ROLES },
  { href: '/dashboard/scan', icon: 'scan', roles: OPERATOR_ROLES },
  { href: '/dashboard/operators', icon: 'operators', roles: PLATFORM_ADMIN_ROLES },
  { href: '/dashboard/onboarding', icon: 'onboarding', roles: PLATFORM_ADMIN_ROLES },
  { href: '/dashboard/analytics', icon: 'analytics', roles: PLATFORM_ADMIN_ROLES },
  { href: '/dashboard/audit', icon: 'audit', roles: PLATFORM_ADMIN_ROLES },
  {
    href: '/dashboard/admin/trash',
    icon: 'trash',
    roles: PLATFORM_ADMIN_ROLES,
    permission: 'platform:tenant.read',
  },
  {
    href: '/dashboard/admin/approvals',
    icon: 'approvals',
    roles: PLATFORM_ADMIN_ROLES,
    permission: 'platform:tenant.purge',
  },
]

export function navForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter(
    (item) =>
      item.roles.includes(role) &&
      (!item.permission || hasPlatformPermission(role, item.permission)),
  )
}
