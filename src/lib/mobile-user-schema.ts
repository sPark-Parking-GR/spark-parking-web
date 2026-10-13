import { z } from 'zod'
import { MOBILE_ACCOUNT_STATUSES, MOBILE_SOCIAL_PROVIDERS } from '@spark/types'

export const MOBILE_USER_STATUSES = MOBILE_ACCOUNT_STATUSES
export type MobileUserStatus = (typeof MOBILE_USER_STATUSES)[number]

export const MOBILE_SIGN_IN_PROVIDERS = ['password', ...MOBILE_SOCIAL_PROVIDERS] as const
export type MobileSignInProvider = (typeof MOBILE_SIGN_IN_PROVIDERS)[number]

// The API refuses a search term shorter than this with a 400, so the page drops it instead.
export const MOBILE_SEARCH_MIN = 2

export const MOBILE_REASON_MIN = 3
export const MOBILE_REASON_MAX = 500

// The API's enum casing is not part of the contract this page was written against, so both
// spellings are accepted and normalised once here instead of at every comparison.
const statusSchema = z
  .string()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(MOBILE_USER_STATUSES))

const providerSchema = z
  .string()
  .transform((value) => value.toLowerCase())
  .pipe(z.enum(MOBILE_SIGN_IN_PROVIDERS))

const isoDate = z.string().min(1)

export const mobileUserSummarySchema = z.object({
  id: z.string().min(1),
  email: z.string(),
  displayName: z.string().nullable(),
  status: statusSchema,
  createdAt: isoDate,
  lastActiveAt: isoDate.nullable(),
  methods: z.array(providerSchema),
  hasPassword: z.boolean(),
  bookingCount: z.number().int().nonnegative(),
})
export type MobileUserSummary = z.infer<typeof mobileUserSummarySchema>

export const mobileUserListSchema = z.object({
  items: z.array(mobileUserSummarySchema),
  total: z.number().int().nonnegative(),
})
export type MobileUserList = z.infer<typeof mobileUserListSchema>

export const mobileUserDetailSchema = mobileUserSummarySchema.omit({ methods: true }).extend({
  methods: z.array(
    z.object({
      provider: providerSchema,
      email: z.string().nullable(),
      createdAt: isoDate,
      lastUsedAt: isoDate.nullable(),
    }),
  ),
  profile: z
    .object({
      appVersion: z.string().nullable(),
      locale: z.string().nullable(),
      lastActiveAt: isoDate.nullable(),
    })
    .nullable(),
  counts: z.object({
    bookings: z.number().int().nonnegative(),
    vehicles: z.number().int().nonnegative(),
    savedFacilities: z.number().int().nonnegative(),
    reviews: z.number().int().nonnegative(),
  }),
  subscription: z
    .object({
      status: z.string(),
      planName: z.string().nullable(),
      currentPeriodEnd: isoDate.nullable(),
    })
    .nullable(),
})
export type MobileUserDetail = z.infer<typeof mobileUserDetailSchema>

export const mobileReasonSchema = z.string().trim().min(MOBILE_REASON_MIN).max(MOBILE_REASON_MAX)

export const mobileUserIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/)

export const mobileEraseSchema = z.object({
  reason: mobileReasonSchema,
  confirmEmail: z.string().trim().toLowerCase().email().max(320),
})

export const mobileUserListQuerySchema = z.object({
  search: z.string().trim().min(MOBILE_SEARCH_MIN).max(200).optional(),
  status: z.enum(MOBILE_USER_STATUSES).optional(),
  provider: z.enum(MOBILE_SIGN_IN_PROVIDERS).optional(),
  skip: z.number().int().min(0).optional(),
  take: z.number().int().min(1).max(100).optional(),
})
export type MobileUserListQuery = z.infer<typeof mobileUserListQuerySchema>
