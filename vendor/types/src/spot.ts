/** Wire values the mobile spot sheet sends; the API maps them onto its own enum. */
export const FACILITY_REPORT_REASONS = ['closed', 'paid', 'wrongPin', 'other'] as const
export type FacilityReportReason = (typeof FACILITY_REPORT_REASONS)[number]

export const FACILITY_REPORT_STATUSES = ['OPEN', 'REVIEWED', 'DISMISSED'] as const
export type FacilityReportStatus = (typeof FACILITY_REPORT_STATUSES)[number]

export const FACILITY_VOTE_VALUES = ['UP', 'DOWN'] as const
export type FacilityVoteValue = (typeof FACILITY_VOTE_VALUES)[number]

export const FACILITY_SPOT_TYPES = ['STREET', 'LOT', 'GARAGE', 'PRIVATE'] as const
export type FacilitySpotType = (typeof FACILITY_SPOT_TYPES)[number]

export const OPENING_WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const
export type OpeningWeekday = (typeof OPENING_WEEKDAYS)[number]

/** Minutes from local midnight; `close <= open` means the window runs past midnight. */
export interface OpeningWindow {
  open: number
  close: number
}

/**
 * Public read model of a facility's hours. `days` is null when the hours are unknown (not
 * 24h and no schedule), which is distinct from a day mapped to `[]` (closed that day).
 */
export interface FacilityOpeningHoursView {
  is24h: boolean
  timezone: string
  days: Record<OpeningWeekday, OpeningWindow[]> | null
}

export interface FacilityVoteSummary {
  voteScore: number
  voteCount: number
  myVote: FacilityVoteValue | null
}

export interface FacilityReportReceipt {
  id: string
  status: FacilityReportStatus
}

export interface FacilityEta {
  distanceMeters: number
  durationSeconds: number
  provider: string
}
