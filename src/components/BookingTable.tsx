import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import { BookingActionButton } from './BookingActionButton'
import type { BookingListItem, BookingStatus } from '@/lib/booking-api'

interface Props {
  items: BookingListItem[]
}

const STATUS_BADGE: Record<BookingStatus, { labelKey: string; variant: BadgeVariant }> = {
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

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(cents / 100)
}

export async function BookingTable({ items }: Props) {
  const t = await getTranslations('bookings')

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('table.accessCode')}</th>
            <th>{t('table.facility')}</th>
            <th>{t('table.vehicle')}</th>
            <th>{t('table.window')}</th>
            <th className="table-amount">{t('table.price')}</th>
            <th>{t('table.status')}</th>
            <th>{t('table.action')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const badge = STATUS_BADGE[item.status]
            const price = item.finalPriceCents ?? item.quotedPriceCents
            return (
              <tr key={item.id}>
                <td>
                  <span className="mono table-code">{item.accessCode}</span>
                </td>
                <td className="table-facility">{item.facility.name}</td>
                <td className="text-secondary">
                  <span className="mono">{item.vehiclePlate}</span>
                  <span> · {item.vehicleType.toLowerCase()}</span>
                </td>
                <td className="text-secondary">
                  {dateFmt.format(new Date(item.startsAt))} → {dateFmt.format(new Date(item.endsAt))}
                </td>
                <td className="table-amount">{formatMoney(price, item.currency)}</td>
                <td>
                  <Badge variant={badge.variant}>{t(badge.labelKey)}</Badge>
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
