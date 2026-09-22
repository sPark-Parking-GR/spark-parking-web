import { z } from 'zod'

// Deliberately local rather than shared through @spark/types: one string is not an
// abstraction, and the operator catalog's feature list is a different product surface that
// must be free to diverge. Same call this repo already makes for TeamActionResult.
export const DRIVER_SUBSCRIPTION_FEATURES = ['support.priority'] as const

export type DriverSubscriptionFeature = (typeof DRIVER_SUBSCRIPTION_FEATURES)[number]

export const BILLING_INTERVALS = ['MONTHLY', 'YEARLY'] as const

export type BillingInterval = (typeof BILLING_INTERVALS)[number]

export const DRIVER_SUBSCRIPTION_STATUSES = [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELLED',
] as const

export type DriverSubscriptionStatus = (typeof DRIVER_SUBSCRIPTION_STATUSES)[number]

export type DriverPlanLifecycleStatus = 'ACTIVE' | 'ARCHIVED' | 'TOMBSTONED' | 'PURGED'

export type DriverEntitlementSource = 'free' | 'subscription' | 'subscription+override'

// `bookingDiscountBps: null` means the plan grants no discount at all, and
// `freeCancellations: null` means the perk is uncapped — the two nulls are not the same
// idea, which is why each gets its own labelled checkbox in the editor.
export interface DriverEntitlements {
  bookingDiscountBps: number | null
  bookingFeeWaived: boolean
  freeCancellations: number | null
  features: DriverSubscriptionFeature[]
}

export type DriverEntitlementOverride = Partial<DriverEntitlements>

export const ENTITLEMENT_KEYS = [
  'bookingDiscountBps',
  'bookingFeeWaived',
  'freeCancellations',
  'features',
] as const satisfies readonly (keyof DriverEntitlements)[]

export interface DriverPlan {
  id: string
  code: string
  name: string
  description: string | null
  priceCents: number
  currency: string
  interval: BillingInterval
  entitlements: DriverEntitlements
  isPublic: boolean
  sortOrder: number
  lifecycleStatus: DriverPlanLifecycleStatus
  subscribers: number
}

export interface DriverPlanDraft {
  code: string
  name: string
  description: string
  priceCents: number
  currency: string
  interval: BillingInterval
  entitlements: DriverEntitlements
  isPublic: boolean
  sortOrder: number
}

export interface DriverSubscriptionDetail {
  userId: string
  entitlements: DriverEntitlements
  source: DriverEntitlementSource
  planCode: string | null
  planName: string | null
  subscriptionId: string | null
  status: DriverSubscriptionStatus | null
  planId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  trialEndsAt: string | null
  cancelAtPeriodEnd: boolean
  providerSubscriptionId: string | null
  entitlementOverride: DriverEntitlementOverride | null
}

export const driverEntitlementsSchema = z.object({
  bookingDiscountBps: z
    .number()
    .int('validation.discountRange')
    .min(0, 'validation.discountRange')
    .max(10_000, 'validation.discountRange')
    .nullable(),
  bookingFeeWaived: z.boolean(),
  freeCancellations: z
    .number()
    .int('validation.freeCancellationsRange')
    .min(0, 'validation.freeCancellationsRange')
    .max(1_000_000, 'validation.freeCancellationsRange')
    .nullable(),
  features: z.array(z.enum(DRIVER_SUBSCRIPTION_FEATURES)),
})

export const driverEntitlementOverrideSchema = driverEntitlementsSchema.partial()

export const driverPlanDraftSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'validation.codeFormat')
    .max(50, 'validation.codeFormat')
    .regex(/^[a-z0-9][a-z0-9_-]*$/, 'validation.codeFormat'),
  name: z.string().trim().min(2, 'validation.nameRequired').max(100, 'validation.nameTooLong'),
  description: z.string().trim().max(500, 'validation.descriptionTooLong'),
  priceCents: z
    .number()
    .int('validation.priceRange')
    .min(0, 'validation.priceRange')
    .max(100_000_000, 'validation.priceRange'),
  currency: z
    .string()
    .trim()
    .length(3, 'validation.currencyFormat')
    .regex(/^[A-Z]{3}$/, 'validation.currencyFormat'),
  interval: z.enum(BILLING_INTERVALS),
  entitlements: driverEntitlementsSchema,
  isPublic: z.boolean(),
  sortOrder: z
    .number()
    .int('validation.sortOrderRange')
    .min(0, 'validation.sortOrderRange')
    .max(10_000, 'validation.sortOrderRange'),
})

export type DriverPlanDraftValues = z.infer<typeof driverPlanDraftSchema>

export const FREE_TIER_ENTITLEMENTS: DriverEntitlements = {
  bookingDiscountBps: null,
  bookingFeeWaived: false,
  freeCancellations: null,
  features: [],
}

export function emptyDriverPlanDraft(name: string): DriverPlanDraft {
  return {
    code: '',
    name,
    description: '',
    priceCents: 0,
    currency: 'EUR',
    interval: 'MONTHLY',
    entitlements: { ...FREE_TIER_ENTITLEMENTS, features: [] },
    isPublic: true,
    sortOrder: 0,
  }
}

export function toDriverPlanDraft(plan: DriverPlan): DriverPlanDraft {
  return {
    code: plan.code,
    name: plan.name,
    description: plan.description ?? '',
    priceCents: plan.priceCents,
    currency: plan.currency,
    interval: plan.interval,
    entitlements: plan.entitlements,
    isPublic: plan.isPublic,
    sortOrder: plan.sortOrder,
  }
}

export function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function amountToCents(value: string): number {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}

export function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(2)
}

export function percentToBps(value: string): number {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}
