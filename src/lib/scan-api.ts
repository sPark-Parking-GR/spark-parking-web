import { apiFetch } from './api'
import type { BookingStatus } from './booking-api'

export type TicketVerdict =
  'valid' | 'invalid_signature' | 'outside_time_window' | 'already_used' | 'not_honourable'

export type TicketMethod = 'qr' | 'access_code'

export type CheckInOutcome = 'performed' | 'already_checked_in' | 'not_applicable'

export interface VerifyQrBookingSummary {
  id: string
  accessCode: string
  status: BookingStatus
  vehiclePlate: string
  vehicleType: string
  startsAt: string
  endsAt: string
  facility: { id: string; name: string }
}

export interface VerifyQrResponse {
  verdict: TicketVerdict
  valid: boolean
  method: TicketMethod
  checkIn: CheckInOutcome | null
  booking: VerifyQrBookingSummary
}

export interface VerifyQrRequest {
  payload?: string
  accessCode?: string
  autoCheckIn?: boolean
}

export function verifyQr(input: VerifyQrRequest): Promise<VerifyQrResponse> {
  return apiFetch<VerifyQrResponse>('/bookings/verify-qr', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
