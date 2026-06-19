import { z } from 'zod'
import type { VehicleType } from '@spark/types'
import type { TariffDraft, TariffRate, TariffTier, TariffWindow } from './tariff-api'

const VEHICLE_TYPES = ['car', 'motorcycle', 'van', 'truck'] as const
const UNITS = ['per_minute', 'per_block', 'flat'] as const
const CAP_SCOPES = ['stay', 'rolling'] as const

const isoDateString = z
  .string()
  .trim()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Enter a valid date.')

const tierSchema = z.object({
  key: z.string().min(1),
  fromMinute: z.number().int().min(0),
  toMinute: z.number().int().positive().nullable(),
  unit: z.enum(UNITS),
  blockMinutes: z.number().int().positive().nullable(),
})

const windowSchema = z.object({
  key: z.string().min(1),
  label: z.string().trim().min(1, 'Window label is required.'),
  dayMask: z.number().int().min(0).max(127),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(0).max(1440),
})

const rateSchema = z.object({
  tierKey: z.string().min(1),
  windowKey: z.string().min(1),
  priceCents: z.number().int().min(0, 'Price must be 0 or greater.'),
  currency: z.string().trim().min(1),
})

const capSchema = z.object({
  windowMinutes: z.number().int().positive('Cap window must be greater than 0.'),
  capCents: z.number().int().min(0, 'Cap amount must be 0 or greater.'),
  scope: z.enum(CAP_SCOPES),
})

export const tariffDraftSchema = z
  .object({
    name: z.string().trim().min(1, 'Plan name is required.'),
    isDefault: z.boolean(),
    isActive: z.boolean(),
    validFrom: isoDateString.nullable(),
    validTo: isoDateString.nullable(),
    timezone: z.string().trim().min(1, 'Timezone is required.'),
    graceMinutes: z.number().int().min(0, 'Grace minutes must be 0 or greater.'),
    incrementMinutes: z.number().int().positive('Increment minutes must be at least 1.'),
    vehicleTypes: z.array(z.enum(VEHICLE_TYPES)).min(1, 'Select at least one vehicle type.'),
    tiers: z.array(tierSchema).min(1, 'Add at least one tier.'),
    windows: z.array(windowSchema).min(1, 'Add at least one window.'),
    rates: z.array(rateSchema),
    caps: z.array(capSchema),
  })
  .superRefine((draft, ctx) => {
    if (draft.validFrom && draft.validTo && Date.parse(draft.validFrom) >= Date.parse(draft.validTo)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['validTo'], message: 'Valid-to must be after valid-from.' })
    }

    const openEnded = draft.tiers.filter((t) => t.toMinute === null)
    if (openEnded.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tiers'],
        message: 'There must be exactly one open-ended tier (no upper bound).',
      })
    } else if (draft.tiers[draft.tiers.length - 1]?.toMinute !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tiers'],
        message: 'The open-ended tier must be the last tier.',
      })
    }

    let cursor = 0
    draft.tiers.forEach((tier, i) => {
      if (tier.fromMinute !== cursor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tiers', i, 'fromMinute'],
          message: 'Tiers must tile the duration axis contiguously with no gaps or overlaps.',
        })
      }
      if (tier.toMinute !== null) {
        if (tier.toMinute <= tier.fromMinute) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tiers', i, 'toMinute'],
            message: 'Tier end must be after its start.',
          })
        }
        cursor = tier.toMinute
      }
      if (tier.unit === 'per_block' && (tier.blockMinutes === null || tier.blockMinutes <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tiers', i, 'blockMinutes'],
          message: 'Per-block tiers need a positive block size.',
        })
      }
    })

    const windowKeys = new Set<string>()
    draft.windows.forEach((w, i) => {
      if (windowKeys.has(w.key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['windows', i, 'key'],
          message: 'Window keys must be unique.',
        })
      }
      windowKeys.add(w.key)
    })

    const expectedCells = draft.tiers.length * draft.windows.length
    const cellSet = new Set(draft.rates.map((r) => `${r.tierKey}::${r.windowKey}`))
    if (draft.rates.length !== expectedCells || cellSet.size !== expectedCells) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rates'],
        message: 'Every tier × window cell needs a price. The rate grid is incomplete.',
      })
    } else {
      for (const tier of draft.tiers) {
        for (const win of draft.windows) {
          if (!cellSet.has(`${tier.key}::${win.key}`)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['rates'],
              message: 'Every tier × window cell needs a price. The rate grid is incomplete.',
            })
          }
        }
      }
    }
  })

export type TariffDraftValues = z.infer<typeof tariffDraftSchema>

export const VEHICLE_TYPE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
]

export const UNIT_OPTIONS: { value: TariffTier['unit']; label: string }[] = [
  { value: 'per_minute', label: 'Per minute' },
  { value: 'per_block', label: 'Per block' },
  { value: 'flat', label: 'Flat' },
]

export const CAP_SCOPE_OPTIONS: { value: TariffCapScope; label: string }[] = [
  { value: 'stay', label: 'Whole stay' },
  { value: 'rolling', label: 'Rolling window' },
]

type TariffCapScope = (typeof CAP_SCOPES)[number]

// WHY: bit0=Monday .. bit6=Sunday — order matches the API dayMask contract.
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export const DAY_BITS = WEEKDAY_LABELS.map((_, i) => 1 << i)
export const ALL_DAYS_MASK = 127

export function makeKey(): string {
  return crypto.randomUUID()
}

export function minutesToHHMM(minutes: number): string {
  const clamped = Math.max(0, Math.min(1440, minutes))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function hhmmToMinutes(value: string): number {
  const [h, m] = value.split(':')
  const hours = Number(h)
  const mins = Number(m)
  if (Number.isNaN(hours) || Number.isNaN(mins)) return 0
  return hours * 60 + mins
}

export function buildRateGrid(
  tiers: TariffTier[],
  windows: TariffWindow[],
  existingRates: TariffRate[],
  currency: string,
): TariffRate[] {
  const byCell = new Map(existingRates.map((r) => [`${r.tierKey}::${r.windowKey}`, r]))
  const next: TariffRate[] = []
  for (const tier of tiers) {
    for (const win of windows) {
      const existing = byCell.get(`${tier.key}::${win.key}`)
      next.push({
        tierKey: tier.key,
        windowKey: win.key,
        priceCents: existing?.priceCents ?? 0,
        currency,
      })
    }
  }
  return next
}

export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function eurosToCents(value: string): number {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}
