import { z } from 'zod'
import { SUBSCRIPTION_FEATURES } from '@spark/types'
import type { SubscriptionFeature, SubscriptionStatus } from '@spark/types'

export const QUOTA_KEYS = ['maxFacilities', 'maxTariffPlans', 'maxStaffSeats'] as const

export type QuotaKey = (typeof QUOTA_KEYS)[number]

export const BILLING_INTERVALS = ['MONTHLY', 'YEARLY'] as const

export const SUBSCRIPTION_STATUSES = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED'] as const

// Message-key aliases: next-intl reads a dot as a path separator, so the feature ids
// themselves cannot be message keys.
export const FEATURE_LABEL_KEY: Record<SubscriptionFeature, string> = {
  'analytics.advanced': 'analyticsAdvanced',
  'support.priority': 'supportPriority',
  'team.management': 'teamManagement',
}

export const STATUS_LABEL_KEY: Record<SubscriptionStatus, string> = {
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'pastDue',
  CANCELLED: 'cancelled',
}

const limitSchema = z
  .number({ invalid_type_error: 'validation.limitInvalid' })
  .int('validation.limitInvalid')
  .min(0, 'validation.limitMin')
  .max(1_000_000, 'validation.limitMax')
  .nullable()

const commissionSchema = z
  .number({ invalid_type_error: 'validation.commissionInvalid' })
  .int('validation.commissionInvalid')
  .min(0, 'validation.commissionMin')
  .max(10_000, 'validation.commissionMax')

const featuresSchema = z.array(z.enum(SUBSCRIPTION_FEATURES), {
  invalid_type_error: 'validation.featuresInvalid',
})

export const entitlementsDraftSchema = z.object({
  maxFacilities: limitSchema,
  maxTariffPlans: limitSchema,
  maxStaffSeats: limitSchema,
  features: featuresSchema,
  commissionBps: commissionSchema,
})

export const entitlementOverrideDraftSchema = entitlementsDraftSchema.partial()

export const operatorPlanDraftSchema = z.object({
  code: z
    .string({ invalid_type_error: 'validation.codeRequired' })
    .trim()
    .min(2, 'validation.codeRequired')
    .max(50, 'validation.codeTooLong')
    .regex(/^[a-z0-9][a-z0-9_-]*$/, 'validation.codeFormat'),
  name: z
    .string({ invalid_type_error: 'validation.nameRequired' })
    .trim()
    .min(2, 'validation.nameRequired')
    .max(100, 'validation.nameTooLong'),
  description: z
    .string({ invalid_type_error: 'validation.descriptionTooLong' })
    .trim()
    .max(500, 'validation.descriptionTooLong'),
  priceCents: z
    .number({ invalid_type_error: 'validation.priceInvalid' })
    .int('validation.priceInvalid')
    .min(0, 'validation.priceMin')
    .max(100_000_000, 'validation.priceMax'),
  currency: z
    .string({ invalid_type_error: 'validation.currencyFormat' })
    .trim()
    .regex(/^[A-Z]{3}$/, 'validation.currencyFormat'),
  interval: z.enum(BILLING_INTERVALS, { invalid_type_error: 'validation.intervalInvalid' }),
  entitlements: entitlementsDraftSchema,
  isPublic: z.boolean({ invalid_type_error: 'validation.isPublicInvalid' }),
  sortOrder: z
    .number({ invalid_type_error: 'validation.sortOrderInvalid' })
    .int('validation.sortOrderInvalid')
    .min(0, 'validation.sortOrderMin')
    .max(10_000, 'validation.sortOrderMax'),
})

export const assignSubscriptionDraftSchema = z.object({
  planId: z.string().trim().min(1, 'validation.planRequired'),
  status: z.enum(SUBSCRIPTION_STATUSES, { invalid_type_error: 'validation.statusInvalid' }),
})

/**
 * Money and commission are integer minor units / basis points on the wire, but neither is a
 * unit an administrator thinks in — so the conversion happens here, once, and the raw values
 * never reach an input. `NaN` on an unparseable string is deliberate: it fails the numeric
 * schema above and surfaces as a validation message instead of silently becoming 0.
 */
export function centsToAmountInput(cents: number): string {
  return Number.isFinite(cents) ? (cents / 100).toFixed(2) : ''
}

export function amountInputToCents(value: string): number {
  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : Number.NaN
}

export function bpsToPercentInput(bps: number): string {
  return Number.isFinite(bps) ? (bps / 100).toFixed(2) : ''
}

export function percentInputToBps(value: string): number {
  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : Number.NaN
}
