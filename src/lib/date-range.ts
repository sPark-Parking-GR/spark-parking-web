import type { RevenueBucket } from './analytics-api'

export const RANGE_PRESETS = ['7d', '30d', '90d', '12m'] as const
export type RangePreset = (typeof RANGE_PRESETS)[number]

export const DEFAULT_RANGE_PRESET: RangePreset = '30d'

const PRESET_DAYS: Record<RangePreset, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12m': 365,
}

const PRESET_BUCKET: Record<RangePreset, RevenueBucket> = {
  '7d': 'day',
  '30d': 'day',
  '90d': 'week',
  '12m': 'month',
}

export interface ResolvedRange {
  preset: RangePreset
  from: Date
  to: Date
  bucket: RevenueBucket
}

export function parseRangePreset(value: string | undefined): RangePreset {
  return (RANGE_PRESETS as readonly string[]).includes(value ?? '')
    ? (value as RangePreset)
    : DEFAULT_RANGE_PRESET
}

// `to` is exclusive at the API boundary, so it is pinned to the UTC midnight after
// today: every bucket up to and including today's partial data is covered, and the
// span always tiles into exactly PRESET_DAYS whole buckets.
export function resolveRange(preset: RangePreset, now: Date = new Date()): ResolvedRange {
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  const from = new Date(to.getTime() - PRESET_DAYS[preset] * 24 * 60 * 60 * 1000)
  return { preset, from, to, bucket: PRESET_BUCKET[preset] }
}
