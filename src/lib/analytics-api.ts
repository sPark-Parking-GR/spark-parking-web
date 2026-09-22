import { apiFetch } from './api'

export const REVENUE_BUCKETS = ['day', 'week', 'month'] as const
export type RevenueBucket = (typeof REVENUE_BUCKETS)[number]

export interface AnalyticsRange {
  from: string
  to: string
}

export interface OccupancySummary {
  bookedSlotMinutes: number
  capacitySlotMinutes: number
  ratio: number
}

export interface AnalyticsSummary {
  range: AnalyticsRange
  currency: string
  grossRevenueCents: number
  refundedCents: number
  netRevenueCents: number
  bookingCount: number
  averageTicketCents: number
  occupancy: OccupancySummary
}

export interface RevenuePoint {
  bucketStart: string
  grossRevenueCents: number
  refundedCents: number
  netRevenueCents: number
  bookingCount: number
}

export interface RevenueSeries {
  range: AnalyticsRange
  bucket: RevenueBucket
  currency: string
  points: RevenuePoint[]
}

export interface TopFacility {
  facilityId: string
  facilityName: string
  operatorId: string
  grossRevenueCents: number
  refundedCents: number
  netRevenueCents: number
  bookingCount: number
}

export interface TopFacilities {
  range: AnalyticsRange
  currency: string
  items: TopFacility[]
}

interface AnalyticsRangeParams {
  from: string
  to: string
  operatorId?: string
}

function rangeQuery(params: AnalyticsRangeParams): URLSearchParams {
  const query = new URLSearchParams()
  query.set('from', params.from)
  query.set('to', params.to)
  if (params.operatorId) query.set('operatorId', params.operatorId)
  return query
}

export function getAnalyticsSummary(params: AnalyticsRangeParams): Promise<AnalyticsSummary> {
  return apiFetch<AnalyticsSummary>(`/analytics/summary?${rangeQuery(params).toString()}`)
}

export function getRevenueSeries(
  params: AnalyticsRangeParams & { bucket: RevenueBucket },
): Promise<RevenueSeries> {
  const query = rangeQuery(params)
  query.set('bucket', params.bucket)
  return apiFetch<RevenueSeries>(`/analytics/revenue-series?${query.toString()}`)
}

export function getTopFacilities(
  params: AnalyticsRangeParams & { limit?: number },
): Promise<TopFacilities> {
  const query = rangeQuery(params)
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  return apiFetch<TopFacilities>(`/analytics/top-facilities?${query.toString()}`)
}
