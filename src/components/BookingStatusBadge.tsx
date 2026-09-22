import { RefreshCw } from 'lucide-react'
import { Badge } from '@spark/ui'
import { STATUS_BADGE } from '@/lib/booking-format'
import type { BookingStatus } from '@/lib/booking-api'

export function BookingStatusBadge({ status, label }: { status: BookingStatus; label: string }) {
  const badge = STATUS_BADGE[status]

  return (
    <Badge variant={badge.variant}>
      {status === 'REFUND_PENDING' ? (
        <RefreshCw size={11} strokeWidth={2.5} aria-hidden="true" className="badge-icon" />
      ) : null}
      {label}
    </Badge>
  )
}
