import Link from 'next/link'
import { Check, CheckCheck, Clock, MapPin, RotateCcw, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { maskAccessCode } from '@/lib/access-code'
import type { BookingListItem, BookingStatus } from '@/lib/booking-api'
import { createDashboardFormatters, intlLocale } from '@/lib/dashboard-format'
import { titleCase } from '@/lib/booking-format'

type PillKind = 'active' | 'confirmed' | 'completed' | 'cancelled' | 'pending'

const PILL_BY_STATUS: Record<BookingStatus, { kind: PillKind; labelKey: string }> = {
  CHECKED_IN: { kind: 'active', labelKey: 'active' },
  CONFIRMED: { kind: 'confirmed', labelKey: 'confirmed' },
  CHECKED_OUT: { kind: 'completed', labelKey: 'completed' },
  CANCELLED: { kind: 'cancelled', labelKey: 'cancelled' },
  EXPIRED: { kind: 'cancelled', labelKey: 'expired' },
  PENDING_PAYMENT: { kind: 'pending', labelKey: 'pending' },
  REFUND_PENDING: { kind: 'pending', labelKey: 'refundPending' },
  REFUNDED: { kind: 'completed', labelKey: 'refunded' },
}

const PILL_ICON: Record<PillKind, ReactNode> = {
  active: <span className="ov-pill__pd" aria-hidden="true" />,
  confirmed: <Check size={13} strokeWidth={2.4} aria-hidden="true" />,
  completed: <CheckCheck size={13} strokeWidth={2.4} aria-hidden="true" />,
  cancelled: <X size={13} strokeWidth={2.4} aria-hidden="true" />,
  pending: <Clock size={13} strokeWidth={2.4} aria-hidden="true" />,
}

export function BookingStatusPill({ status }: { status: BookingStatus }) {
  const t = useTranslations('overview.status')
  const pill = PILL_BY_STATUS[status]
  return (
    <span className={`ov-pill ov-pill--${pill.kind}`}>
      {status === 'REFUND_PENDING' ? (
        <RotateCcw size={13} strokeWidth={2.4} aria-hidden="true" />
      ) : (
        PILL_ICON[pill.kind]
      )}
      {t(pill.labelKey)}
    </span>
  )
}

interface Props {
  items: BookingListItem[]
  basePath: string
  now?: Date
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function RecentBookings({ items, basePath, now = new Date() }: Props) {
  const t = useTranslations('overview.recentBookings')
  const locale = useLocale()
  const f = createDashboardFormatters(locale)
  const tag = intlLocale(locale)
  const time = new Intl.DateTimeFormat(tag, { hour: '2-digit', minute: '2-digit' })
  const day = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short' })
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  const when = (item: BookingListItem): string => {
    const start = new Date(item.startsAt)
    const key = dayKey(start)
    const label =
      key === dayKey(now)
        ? t('today')
        : key === dayKey(yesterday)
          ? t('yesterday')
          : day.format(start)
    return `${label} · ${time.format(start)}–${time.format(new Date(item.endsAt))}`
  }
  const amount = (item: BookingListItem) =>
    f.money(item.finalPriceCents ?? item.quotedPriceCents, item.currency)

  return (
    <div className="ov-bk-body">
      <table className="ov-tbl ov-rise" data-view="table">
        <thead>
          <tr>
            <th scope="col">{t('columns.booking')}</th>
            <th scope="col">{t('columns.facility')}</th>
            <th scope="col" className="ov-col-vehicle">
              {t('columns.vehicle')}
            </th>
            <th scope="col">{t('columns.when')}</th>
            <th scope="col" className="ov-r">
              {t('columns.amount')}
            </th>
            <th scope="col">{t('columns.status')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="ov-ref">
                <Link href={`${basePath}/${item.id}`}>{maskAccessCode(item.accessCode)}</Link>
                <span className="ov-plate">{item.vehiclePlate}</span>
              </td>
              <td>{item.facility.name}</td>
              <td className="ov-col-vehicle">{titleCase(item.vehicleType)}</td>
              <td>{when(item)}</td>
              <td className="ov-r ov-num">{amount(item)}</td>
              <td>
                <BookingStatusPill status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="ov-blist" data-view="list">
        {items.map((item, i) => (
          <li key={item.id} className="ov-rise" style={{ ['--i' as string]: i }}>
            <span className="ov-bico" aria-hidden="true">
              <MapPin size={20} strokeWidth={1.8} />
            </span>
            <div className="ov-bmid">
              <Link href={`${basePath}/${item.id}`}>{item.facility.name}</Link>
              <span className="ov-sub2">
                {maskAccessCode(item.accessCode)} · {when(item)}
              </span>
            </div>
            <div className="ov-bright">
              <b>{amount(item)}</b>
              <BookingStatusPill status={item.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
