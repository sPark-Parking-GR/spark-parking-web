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
