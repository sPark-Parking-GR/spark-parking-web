import type { UserRole } from '@spark/types'

export type NavIcon =
  | 'overview'
  | 'facilities'
  | 'tariffs'
  | 'bookings'
  | 'operators'
  | 'analytics'
  | 'audit'

export interface NavItem {
  label: string
  href: string
  icon: NavIcon
  description: string
  roles: UserRole[]
}

const OPERATOR_ROLES: UserRole[] = ['operator_staff', 'operator_admin', 'platform_admin']
const OPERATOR_ADMIN_ROLES: UserRole[] = ['operator_admin', 'platform_admin']
const PLATFORM_ADMIN_ROLES: UserRole[] = ['platform_admin']

export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: 'overview', description: 'Snapshot of your parking operations', roles: OPERATOR_ROLES },
  { label: 'Facilities', href: '/dashboard/facilities', icon: 'facilities', description: 'Manage your parking facilities and locations', roles: OPERATOR_ADMIN_ROLES },
  { label: 'Tariffs', href: '/dashboard/tariffs', icon: 'tariffs', description: 'Pricing plans, rates and caps', roles: OPERATOR_ADMIN_ROLES },
  { label: 'Bookings', href: '/dashboard/bookings', icon: 'bookings', description: 'Active and past customer bookings', roles: OPERATOR_ROLES },
  { label: 'Operators', href: '/dashboard/operators', icon: 'operators', description: 'Platform operator accounts', roles: PLATFORM_ADMIN_ROLES },
  { label: 'Analytics', href: '/dashboard/analytics', icon: 'analytics', description: 'Revenue and occupancy insights', roles: PLATFORM_ADMIN_ROLES },
  { label: 'Audit log', href: '/dashboard/audit', icon: 'audit', description: 'Security and change history', roles: PLATFORM_ADMIN_ROLES },
]

export function navForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
