import type { BadgeVariant } from '@spark/ui'
import type { AuditTone } from './audit-format'
import type { BookingStatus } from './booking-api'

export const STATUS_BADGE: Record<BookingStatus, { labelKey: string; variant: BadgeVariant }> = {
  PENDING_PAYMENT: { labelKey: 'status.pendingPayment', variant: 'warn' },
  CONFIRMED: { labelKey: 'status.confirmed', variant: 'ok' },
  CHECKED_IN: { labelKey: 'status.checkedIn', variant: 'ok' },
  CHECKED_OUT: { labelKey: 'status.checkedOut', variant: 'neutral' },
  CANCELLED: { labelKey: 'status.cancelled', variant: 'bad' },
  EXPIRED: { labelKey: 'status.expired', variant: 'bad' },
  REFUND_PENDING: { labelKey: 'status.refundPending', variant: 'warn' },
  REFUNDED: { labelKey: 'status.refunded', variant: 'neutral' },
}

export const BOOKING_STATUS_FILTERS: { labelKey: string; value?: BookingStatus }[] = [
  { labelKey: 'filters.all' },
  { labelKey: 'filters.pendingPayment', value: 'PENDING_PAYMENT' },
  { labelKey: 'filters.confirmed', value: 'CONFIRMED' },
  { labelKey: 'filters.checkedIn', value: 'CHECKED_IN' },
  { labelKey: 'filters.checkedOut', value: 'CHECKED_OUT' },
  { labelKey: 'filters.cancelled', value: 'CANCELLED' },
  { labelKey: 'filters.expired', value: 'EXPIRED' },
  { labelKey: 'filters.refundPending', value: 'REFUND_PENDING' },
  { labelKey: 'filters.refunded', value: 'REFUNDED' },
]

export function parseBookingStatus(value: string | undefined): BookingStatus | undefined {
  return BOOKING_STATUS_FILTERS.find((f) => f.value === value)?.value
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatBookingDate(iso: string): string {
  return dateFmt.format(new Date(iso))
}

export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(cents / 100)
}

export function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

export function shortId(id: string): string {
  return id.slice(0, 10)
}

export function statusTone(status: BookingStatus): AuditTone {
  if (status === 'CANCELLED' || status === 'EXPIRED') return 'danger'
  if (status === 'PENDING_PAYMENT' || status === 'REFUND_PENDING') return 'warning'
  if (
    status === 'CONFIRMED' ||
    status === 'CHECKED_IN' ||
    status === 'CHECKED_OUT' ||
    status === 'REFUNDED'
  ) {
    return 'success'
  }
  return 'primary'
}
