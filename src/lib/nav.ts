import type { UserRole } from '@spark/types'

export interface NavItem {
  label: string
  href: string
  icon: string
  roles: UserRole[]
}

const OPERATOR_ROLES: UserRole[] = ['operator_staff', 'operator_admin', 'platform_admin']
const OPERATOR_ADMIN_ROLES: UserRole[] = ['operator_admin', 'platform_admin']
const PLATFORM_ADMIN_ROLES: UserRole[] = ['platform_admin']

export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: '⊞', roles: OPERATOR_ROLES },
  { label: 'Facilities', href: '/dashboard/facilities', icon: '⌂', roles: OPERATOR_ADMIN_ROLES },
  { label: 'Tariffs', href: '/dashboard/tariffs', icon: '€', roles: OPERATOR_ADMIN_ROLES },
  { label: 'Bookings', href: '/dashboard/bookings', icon: '◷', roles: OPERATOR_ROLES },
  { label: 'Operators', href: '/dashboard/operators', icon: '◉', roles: PLATFORM_ADMIN_ROLES },
  { label: 'Analytics', href: '/dashboard/analytics', icon: '◫', roles: PLATFORM_ADMIN_ROLES },
  { label: 'Audit log', href: '/dashboard/audit', icon: '◳', roles: PLATFORM_ADMIN_ROLES },
]

export function navForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
