import type { MobileSignInMethodKind } from './auth'
import type { SubscriptionStatus } from './subscriptions'

/**
 * The super-admin view of rider accounts: GET/POST /admin/mobile-users. Gated on
 * `identity:mobile.read` and `identity:mobile.manage`, which platform admins never hold.
 */
export const MOBILE_ACCOUNT_STATUSES = ['ACTIVE', 'DEACTIVATED', 'SUSPENDED', 'DELETED'] as const

export type MobileAccountStatus = (typeof MOBILE_ACCOUNT_STATUSES)[number]

export interface AdminMobileUserSummary {
  id: string
  email: string
  displayName: string | null
  status: MobileAccountStatus
  /** ISO-8601. */
  createdAt: string
  /** ISO-8601; null when the app never reported activity. */
  lastActiveAt: string | null
  methods: MobileSignInMethodKind[]
  hasPassword: boolean
  bookingCount: number
}

export interface AdminMobileUserPage {
  items: AdminMobileUserSummary[]
  total: number
}

export interface AdminMobileSignInMethod {
  provider: MobileSignInMethodKind
  email: string | null
  /** ISO-8601. */
  createdAt: string
  /** ISO-8601. */
  lastUsedAt: string | null
}

export interface AdminMobileUserDetail extends Omit<AdminMobileUserSummary, 'methods'> {
  methods: AdminMobileSignInMethod[]
  profile: {
    appVersion: string | null
    locale: string | null
    /** ISO-8601. */
    lastActiveAt: string | null
  } | null
  counts: {
    bookings: number
    vehicles: number
    savedFacilities: number
    reviews: number
  }
  subscription: {
    status: SubscriptionStatus
    planName: string
    /** ISO-8601. */
    currentPeriodEnd: string | null
  } | null
}

/** POST /admin/mobile-users/:id/erase. `tombstoned` when retained bookings keep the row. */
export interface AdminMobileUserEraseResult {
  id: string
  tombstoned: boolean
}
