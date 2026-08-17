import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { BookingActionButton } from './BookingActionButton'
import { BookingStatusBadge } from './BookingStatusBadge'
import { STATUS_BADGE, formatBookingDate, formatMoney, titleCase } from '@/lib/booking-format'
import type { BookingListItem } from '@/lib/booking-api'

interface Props {
  items: BookingListItem[]
  basePath?: string
}

export async function BookingTable({ items, basePath = '/dashboard/bookings' }: Props) {
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
                  <Link href={`${basePath}/${item.id}`} className="table-link mono table-code">
                    {item.accessCode}
                  </Link>
                </td>
                <td className="table-facility">{item.facility.name}</td>
                <td className="text-secondary">
                  <span className="mono">{item.vehiclePlate}</span>
                  <span> · {titleCase(item.vehicleType)}</span>
                </td>
                <td className="text-secondary">
                  {formatBookingDate(item.startsAt)} → {formatBookingDate(item.endsAt)}
                </td>
                <td className="table-amount">{formatMoney(price, item.currency)}</td>
                <td>
                  <BookingStatusBadge status={item.status} label={t(badge.labelKey)} />
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
