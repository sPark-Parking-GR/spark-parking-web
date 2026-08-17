import { hasPlatformPermission } from '@spark/types'
import type { PlatformPermission, UserRole } from '@spark/types'

export type NavIcon =
  | 'overview'
  | 'facilities'
  | 'tariffs'
  | 'bookings'
  | 'scan'
  | 'operatorDirectory'
  | 'onboarding'
  | 'analytics'
  | 'audit'
  | 'trash'
  | 'approvals'
  | 'users'
  | 'admins'

export interface NavItem {
  href: string
  icon: NavIcon
  /** Extra gate beyond role, checked with `hasPlatformPermission`. Omit when role alone decides. */
  permission?: PlatformPermission
}

interface OperatorNavItem extends NavItem {
  roles: UserRole[]
}

// platform_admin has its own /admin/* equivalent for facilities, tariffs and bookings
// (cross-operator views/operations) — these three stay operator-only so the sidebar
// never lists the same resource twice. Root overview and scan are unaffected: scan has
// no admin equivalent (operator-only, on purpose), and root stays on OPERATOR_ROLES per
// the dual-access decision — platform_admin reaches both /dashboard and /admin/* routes,
// just through one merged nav list (navForPlatformAdmin) instead of two separate ones.
const OPERATOR_ROLES: UserRole[] = [
  'operator_staff',
  'operator_admin',
  'platform_admin',
  'super_admin',
]
const OPERATOR_ADMIN_ROLES: UserRole[] = ['operator_admin']
const OPERATOR_STAFF_ROLES: UserRole[] = ['operator_staff', 'operator_admin']

const OPERATOR_NAV_ITEMS: OperatorNavItem[] = [
  { href: '/dashboard', icon: 'overview', roles: OPERATOR_ROLES },
  { href: '/dashboard/facilities', icon: 'facilities', roles: OPERATOR_ADMIN_ROLES },
  { href: '/dashboard/tariffs', icon: 'tariffs', roles: OPERATOR_ADMIN_ROLES },
  { href: '/dashboard/bookings', icon: 'bookings', roles: OPERATOR_STAFF_ROLES },
  { href: '/dashboard/scan', icon: 'scan', roles: OPERATOR_ROLES },
]

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: '/admin/operators', icon: 'operatorDirectory', permission: 'platform:tenant.read' },
  { href: '/admin/facilities', icon: 'facilities' },
  { href: '/admin/tariffs', icon: 'tariffs' },
  { href: '/admin/bookings', icon: 'bookings' },
  { href: '/admin/onboarding', icon: 'onboarding' },
  { href: '/admin/analytics', icon: 'analytics' },
  { href: '/admin/audit', icon: 'audit' },
  { href: '/admin/trash', icon: 'trash', permission: 'platform:tenant.read' },
  { href: '/admin/approvals', icon: 'approvals', permission: 'platform:tenant.purge' },
  { href: '/admin/users', icon: 'users', permission: 'identity:user.read' },
  { href: '/admin/admins', icon: 'admins', permission: 'identity:admin.invite' },
]

export function navForOperator(role: UserRole): NavItem[] {
  return OPERATOR_NAV_ITEMS.filter((item) => item.roles.includes(role))
}

// Takes the VIEWER's role rather than assuming platform_admin: the permission field is only
// a real gate if it is resolved against whoever is actually looking at the sidebar, and a
// hardcoded role silently grants every item to any administrative role added later.
export function navForAdmin(role: UserRole): NavItem[] {
  return ADMIN_NAV_ITEMS.filter(
    (item) => !item.permission || hasPlatformPermission(role, item.permission),
  )
}

// One merged nav for the administrative tier, used by both (dashboard) and (admin) layouts —
// routes stay split at /dashboard vs /admin, but the sidebar itself doesn't, so there's
// no separate "surface" to switch between.
export function navForPlatformAdmin(role: UserRole): NavItem[] {
  const overview = OPERATOR_NAV_ITEMS.find((item) => item.href === '/dashboard')
  const scan = OPERATOR_NAV_ITEMS.find((item) => item.href === '/dashboard/scan')
  return [overview, ...navForAdmin(role), scan].filter(
    (item): item is NavItem => item !== undefined,
  )
}
