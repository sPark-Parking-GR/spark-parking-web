import { apiFetch } from './api'

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUND_PENDING'
  | 'REFUNDED'

export interface BookingListItem {
  id: string
  accessCode: string
  status: BookingStatus
  startsAt: string
  endsAt: string
  vehiclePlate: string
  vehicleType: string
  quotedPriceCents: number
  finalPriceCents: number | null
  currency: string
  facility: { id: string; name: string }
  createdAt: string
}

export interface BookingListResponse {
  items: BookingListItem[]
  total: number
  skip: number
  take: number
}

export interface BookingStatusHistoryEntry {
  id: string
  bookingId: string
  status: BookingStatus
  note: string | null
  changedBy: string | null
  changedAt: string
}

// Mirrors BookingService#getBooking exactly: the raw Booking row (no payment/refund
// relation included) plus facility and statusHistory. Payment and refund state must be
// read off `status` — there is no nested payment/refund object in this response.
export interface BookingDetail {
  id: string
  facilityId: string
  userId: string
  vehicleId: string | null
  vehiclePlate: string
  vehicleType: string
  startsAt: string
  endsAt: string
  quotedPriceCents: number
  finalPriceCents: number | null
  priceAdjustmentCents: number | null
  currency: string
  status: BookingStatus
  accessCode: string
  qrSecret: string | null
  tariffPlanId: string | null
  tariffPlanVersion: number | null
  sourceChannel: 'WEB' | 'MOBILE' | 'API'
  idempotencyKey: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  facility: { id: string; name: string; address: string }
  statusHistory: BookingStatusHistoryEntry[]
}

export function listBookings(params: {
  skip?: number
  take?: number
  status?: BookingStatus
  facilityId?: string
  q?: string
}): Promise<BookingListResponse> {
  const query = new URLSearchParams()
  if (params.skip !== undefined) query.set('skip', String(params.skip))
  if (params.take !== undefined) query.set('take', String(params.take))
  if (params.status) query.set('status', params.status)
  if (params.facilityId) query.set('facilityId', params.facilityId)
  if (params.q) query.set('q', params.q)
  const qs = query.toString()
  return apiFetch<BookingListResponse>(`/bookings${qs ? `?${qs}` : ''}`)
}

export function getBooking(id: string): Promise<BookingDetail> {
  return apiFetch<BookingDetail>(`/bookings/${id}`)
}

export function checkInBooking(id: string): Promise<void> {
  return apiFetch<void>(`/bookings/${id}/check-in`, { method: 'POST' })
}

export function checkOutBooking(id: string): Promise<void> {
  return apiFetch<void>(`/bookings/${id}/check-out`, { method: 'POST' })
}

export function cancelBooking(id: string): Promise<void> {
  return apiFetch<void>(`/bookings/${id}`, { method: 'DELETE' })
}
