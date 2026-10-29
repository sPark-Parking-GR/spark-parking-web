import type { NavIcon } from './nav'

export type PageTitleKey =
  | { namespace: 'nav'; key: NavIcon }
  | { namespace: 'shell'; key: 'profile' }
  | { namespace: 'documentTitle'; key: AuthTitle }

type AuthTitle =
  | 'login'
  | 'register'
  | 'forgotPassword'
  | 'resetPassword'
  | 'acceptTerms'
  | 'acceptInvite'
  | 'acceptAdminInvite'

const nav = (key: NavIcon): PageTitleKey => ({ namespace: 'nav', key })
const doc = (key: AuthTitle): PageTitleKey => ({ namespace: 'documentTitle', key })

// Longest prefix wins, so a detail page (/admin/facilities/42) shares its menu's title and
// the more specific entries below can override a shorter parent.
const ROUTES: ReadonlyArray<readonly [string, PageTitleKey]> = [
  ['/login', doc('login')],
  ['/register', doc('register')],
  ['/forgot-password', doc('forgotPassword')],
  ['/reset-password', doc('resetPassword')],
  ['/mobile/reset-password', doc('resetPassword')],
  ['/invite/admin/accept', doc('acceptAdminInvite')],
  ['/invite/accept', doc('acceptInvite')],
  ['/dashboard/accept-terms', doc('acceptTerms')],
  ['/dashboard/profile', { namespace: 'shell', key: 'profile' }],
  ['/dashboard/facilities', nav('facilities')],
  ['/dashboard/tariffs', nav('tariffs')],
  ['/dashboard/bookings', nav('bookings')],
  ['/dashboard/scan', nav('scan')],
  ['/dashboard/team', nav('team')],
  ['/dashboard/billing', nav('billing')],
  ['/dashboard', nav('overview')],
  ['/admin/operators', nav('operatorDirectory')],
  ['/admin/facilities', nav('facilities')],
  ['/admin/tariffs', nav('tariffs')],
  ['/admin/operator-plans', nav('operatorPlans')],
  ['/admin/driver-plans', nav('driverPlans')],
  ['/admin/bookings', nav('bookings')],
  ['/admin/onboarding', nav('onboarding')],
  ['/admin/analytics', nav('analytics')],
  ['/admin/audit', nav('audit')],
  ['/admin/trash', nav('trash')],
  ['/admin/approvals', nav('approvals')],
  ['/admin/users', nav('users')],
  ['/admin/mobile-users', nav('mobileUsers')],
  ['/admin/admins', nav('admins')],
  ['/admin/ingestion', nav('ingestion')],
  ['/admin/settings', nav('settings')],
  ['/admin', nav('overview')],
]

export function pageTitleKeyFor(pathname: string): PageTitleKey | null {
  let best: { prefix: string; target: PageTitleKey } | null = null
  for (const [prefix, target] of ROUTES) {
    const matches = pathname === prefix || pathname.startsWith(`${prefix}/`)
    if (matches && (best === null || prefix.length > best.prefix.length)) {
      best = { prefix, target }
    }
  }
  return best?.target ?? null
}
