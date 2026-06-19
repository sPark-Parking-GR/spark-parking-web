import { BookingActionButton } from './BookingActionButton'
import type { BookingListItem, BookingStatus } from '@/lib/booking-api'

interface Props {
  items: BookingListItem[]
}

const STATUS_BADGE: Record<BookingStatus, { label: string; variant: string }> = {
  PENDING_PAYMENT: { label: 'Pending payment', variant: 'badge--warning' },
  CONFIRMED: { label: 'Confirmed', variant: 'badge--success' },
  CHECKED_IN: { label: 'Checked in', variant: 'badge--warning' },
  CHECKED_OUT: { label: 'Checked out', variant: 'badge--neutral' },
  CANCELLED: { label: 'Cancelled', variant: 'badge--neutral' },
  EXPIRED: { label: 'Expired', variant: 'badge--neutral' },
  REFUND_PENDING: { label: 'Refund pending', variant: 'badge--warning' },
  REFUNDED: { label: 'Refunded', variant: 'badge--error' },
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(cents / 100)
}

export function BookingTable({ items }: Props) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Access code</th>
            <th>Facility</th>
            <th>Vehicle</th>
            <th>Window</th>
            <th>Price</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const badge = STATUS_BADGE[item.status]
            const price = item.finalPriceCents ?? item.quotedPriceCents
            return (
              <tr key={item.id}>
                <td>
                  <span className="mono">{item.accessCode}</span>
                </td>
                <td>{item.facility.name}</td>
                <td>
                  <span className="mono">{item.vehiclePlate}</span>
                  <span className="text-secondary"> · {item.vehicleType.toLowerCase()}</span>
                </td>
                <td className="text-secondary">
                  {dateFmt.format(new Date(item.startsAt))} → {dateFmt.format(new Date(item.endsAt))}
                </td>
                <td>{formatMoney(price, item.currency)}</td>
                <td>
                  <span className={`badge ${badge.variant}`}>{badge.label}</span>
                </td>
                <td>
                  {item.status === 'CONFIRMED' ? (
                    <BookingActionButton id={item.id} kind="check-in" />
                  ) : item.status === 'CHECKED_IN' ? (
                    <BookingActionButton id={item.id} kind="check-out" />
                  ) : (
                    <span className="text-secondary">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
