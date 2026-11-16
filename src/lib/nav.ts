import { hasPlatformPermission } from '@spark/types'
import type { PlatformPermission, UserRole } from '@spark/types'

export type NavIcon =
  | 'overview'
  | 'facilities'
  | 'tariffs'
  | 'operatorPlans'
  | 'driverPlans'
  | 'bookings'
  | 'scan'
  | 'team'
  | 'billing'
  | 'operatorDirectory'
  | 'onboarding'
  | 'analytics'
  | 'audit'
  | 'trash'
  | 'approvals'
  | 'users'
  | 'mobileUsers'
  | 'admins'
  | 'settings'
  | 'ingestion'

export type NavGroupId = 'operations' | 'network' | 'manage' | 'review' | 'accounts' | 'system'

export interface NavItem {
  href: string
  icon: NavIcon
  group: NavGroupId
  /** Extra gate beyond role, checked with `hasPlatformPermission`. Omit when role alone decides. */
  permission?: PlatformPermission
}

export interface NavGroup {
  id: NavGroupId
  items: NavItem[]
}

const GROUP_ORDER: NavGroupId[] = [
  'operations',
  'network',
  'manage',
  'review',
  'accounts',
  'system',
]

// Sidebar order within a group. Lives apart from the item lists so gating stays where it was
// and the merged administrative list can still be assembled from the operator one.
const ITEM_ORDER: NavIcon[] = [
  'overview',
  'analytics',
  'bookings',
  'scan',
  'operatorDirectory',
  'facilities',
  'tariffs',
  'operatorPlans',
  'driverPlans',
  'onboarding',
  'approvals',
  'ingestion',
  'users',
  'mobileUsers',
  'admins',
  'team',
  'audit',
  'trash',
  'settings',
  'billing',
]

export function groupNavItems(items: NavItem[]): NavGroup[] {
  const rank = (item: NavItem) => ITEM_ORDER.indexOf(item.icon)
  return GROUP_ORDER.flatMap((id) => {
    const inGroup = items.filter((item) => item.group === id).sort((a, b) => rank(a) - rank(b))
    return inGroup.length > 0 ? [{ id, items: inGroup }] : []
  })
}

// The phone tab bar carries the four destinations people reach for most, plus a Menu button
// that opens the drawer. Only routes the viewer can actually reach are offered.
const TAB_ICONS: NavIcon[] = ['overview', 'bookings', 'scan', 'analytics']

export function tabItemsFor(items: NavItem[]): NavItem[] {
  return TAB_ICONS.flatMap((icon) => {
    const item = items.find((candidate) => candidate.icon === icon)
    return item ? [item] : []
  })
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
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
  { href: '/dashboard', icon: 'overview', group: 'operations', roles: OPERATOR_ROLES },
  {
    href: '/dashboard/facilities',
    icon: 'facilities',
    group: 'manage',
    roles: OPERATOR_ADMIN_ROLES,
  },
  { href: '/dashboard/tariffs', icon: 'tariffs', group: 'manage', roles: OPERATOR_ADMIN_ROLES },
  {
    href: '/dashboard/bookings',
    icon: 'bookings',
    group: 'operations',
    roles: OPERATOR_STAFF_ROLES,
  },
  { href: '/dashboard/scan', icon: 'scan', group: 'operations', roles: OPERATOR_ROLES },
  { href: '/dashboard/team', icon: 'team', group: 'accounts', roles: OPERATOR_ADMIN_ROLES },
  { href: '/dashboard/billing', icon: 'billing', group: 'system', roles: OPERATOR_ADMIN_ROLES },
]

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: '/admin/operators',
    icon: 'operatorDirectory',
    group: 'network',
    permission: 'platform:tenant.read',
  },
  { href: '/admin/facilities', icon: 'facilities', group: 'network' },
  { href: '/admin/tariffs', icon: 'tariffs', group: 'network' },
  {
    href: '/admin/operator-plans',
    icon: 'operatorPlans',
    group: 'network',
    permission: 'platform:billing.manage',
  },
  {
    href: '/admin/driver-plans',
    icon: 'driverPlans',
    group: 'network',
    permission: 'platform:billing.manage',
  },
  { href: '/admin/bookings', icon: 'bookings', group: 'operations' },
  { href: '/admin/onboarding', icon: 'onboarding', group: 'review' },
  { href: '/admin/analytics', icon: 'analytics', group: 'operations' },
  { href: '/admin/audit', icon: 'audit', group: 'system' },
  { href: '/admin/trash', icon: 'trash', group: 'system', permission: 'platform:tenant.read' },
  {
    href: '/admin/approvals',
    icon: 'approvals',
    group: 'review',
    permission: 'platform:tenant.purge',
  },
  { href: '/admin/users', icon: 'users', group: 'accounts', permission: 'identity:user.read' },
  {
    href: '/admin/mobile-users',
    icon: 'mobileUsers',
    group: 'accounts',
    permission: 'identity:mobile.read',
  },
  { href: '/admin/admins', icon: 'admins', group: 'accounts', permission: 'identity:admin.invite' },
  {
    href: '/admin/ingestion',
    icon: 'ingestion',
    group: 'review',
    permission: 'platform:tenant.write',
  },
  {
    href: '/admin/settings',
    icon: 'settings',
    group: 'system',
    permission: 'platform:billing.manage',
  },
]

// Hrefs an operator loses while the billing system flag is off. Platform administrators are
// never filtered: their sidebar comes from navForPlatformAdmin, which has no such step.
const BILLING_GATED_OPERATOR_HREFS = new Set([
  '/dashboard/bookings',
  '/dashboard/scan',
  '/dashboard/billing',
])

export function navForOperator(role: UserRole, billingEnabled: boolean): NavItem[] {
  return OPERATOR_NAV_ITEMS.filter(
    (item) =>
      item.roles.includes(role) && (billingEnabled || !BILLING_GATED_OPERATOR_HREFS.has(item.href)),
  )
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
