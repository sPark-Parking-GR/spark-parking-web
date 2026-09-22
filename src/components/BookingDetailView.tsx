import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from './PageHeader'
import { BookingStatusBadge } from './BookingStatusBadge'
import { CancelBookingButton } from './CancelBookingButton'
import {
  STATUS_BADGE,
  formatBookingDate,
  formatMoney,
  shortId,
  statusTone,
  titleCase,
} from '@/lib/booking-format'
import type { BookingDetail, BookingStatus } from '@/lib/booking-api'

const CANCELLABLE_STATUSES: BookingStatus[] = ['PENDING_PAYMENT', 'CONFIRMED', 'REFUND_PENDING']

interface Props {
  booking: BookingDetail
  backHref: string
}

export async function BookingDetailView({ booking, backHref }: Props) {
  const t = await getTranslations('bookings')

  const badge = STATUS_BADGE[booking.status]
  const adjustment = booking.priceAdjustmentCents

  return (
    <>
      <Link href={backHref} className="facility-overview__back">
        <ChevronLeft size={16} strokeWidth={2.5} aria-hidden="true" />
        {t('detail.back')}
      </Link>

      <PageHeader
        title={booking.accessCode}
        description={booking.facility.name}
        titleAccessory={<BookingStatusBadge status={booking.status} label={t(badge.labelKey)} />}
        actions={
          CANCELLABLE_STATUSES.includes(booking.status) ? (
            <CancelBookingButton id={booking.id} />
          ) : undefined
        }
      />

      <div className="panel-card panel-card--wide">
        <div className="panel-card__header">
          <h3 className="panel-card__title">{t('detail.sections.overview')}</h3>
        </div>
        <div className="panel-card__body">
          <div className="booking-detail-grid">
            <div className="booking-detail-grid__item">
              <span className="booking-detail-grid__label">{t('detail.fields.facility')}</span>
              <span className="booking-detail-grid__value">
                {booking.facility.name}
                <span className="text-secondary"> · {booking.facility.address}</span>
              </span>
            </div>
            <div className="booking-detail-grid__item">
              <span className="booking-detail-grid__label">{t('detail.fields.customer')}</span>
              <span className="booking-detail-grid__value mono">{booking.userId}</span>
            </div>
            <div className="booking-detail-grid__item">
              <span className="booking-detail-grid__label">{t('detail.fields.vehicle')}</span>
              <span className="booking-detail-grid__value">
                <span className="mono">{booking.vehiclePlate}</span> ·{' '}
                {titleCase(booking.vehicleType)}
              </span>
            </div>
            <div className="booking-detail-grid__item">
              <span className="booking-detail-grid__label">{t('detail.fields.window')}</span>
              <span className="booking-detail-grid__value">
                {formatBookingDate(booking.startsAt)} → {formatBookingDate(booking.endsAt)}
              </span>
            </div>
            <div className="booking-detail-grid__item">
              <span className="booking-detail-grid__label">{t('detail.fields.accessCode')}</span>
              <span className="booking-detail-grid__value mono">{booking.accessCode}</span>
            </div>
            <div className="booking-detail-grid__item">
              <span className="booking-detail-grid__label">{t('detail.fields.quotedPrice')}</span>
              <span className="booking-detail-grid__value">
                {formatMoney(booking.quotedPriceCents, booking.currency)}
              </span>
            </div>
            <div className="booking-detail-grid__item">
              <span className="booking-detail-grid__label">{t('detail.fields.finalPrice')}</span>
              <span className="booking-detail-grid__value">
                {booking.finalPriceCents !== null
                  ? formatMoney(booking.finalPriceCents, booking.currency)
                  : '—'}
              </span>
            </div>
            <div className="booking-detail-grid__item">
              <span className="booking-detail-grid__label">{t('detail.fields.adjustment')}</span>
              <span
                className={`booking-detail-grid__value${
                  adjustment
                    ? adjustment > 0
                      ? ' booking-detail-grid__value--up'
                      : ' booking-detail-grid__value--down'
                    : ''
                }`}
              >
                {adjustment
                  ? `${adjustment > 0 ? '+' : ''}${formatMoney(adjustment, booking.currency)}`
                  : t('detail.noAdjustment')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-card panel-card--wide">
        <div className="panel-card__header">
          <h3 className="panel-card__title">{t('detail.sections.payment')}</h3>
        </div>
        <div className="panel-card__body">
          <p className="text-secondary">{t(`detail.payment.${booking.status}`)}</p>
        </div>
      </div>

      <div className="panel-card panel-card--wide">
        <div className="panel-card__header">
          <h3 className="panel-card__title">{t('detail.sections.timeline')}</h3>
        </div>
        <div className="panel-card__body">
          {booking.statusHistory.length === 0 ? (
            <p className="text-secondary">{t('detail.timeline.empty')}</p>
          ) : (
            <div className="audit-card">
              {booking.statusHistory.map((entry) => {
                const entryBadge = STATUS_BADGE[entry.status]
                return (
                  <div
                    key={entry.id}
                    className={`audit-row audit-row--${statusTone(entry.status)}`}
                  >
                    <span className="audit-row__avatar" aria-hidden="true">
                      <span className="audit-row__dot" />
                    </span>
                    <div className="audit-row__body">
                      <p className="audit-row__line">
                        <b className="audit-row__actor">{t(entryBadge.labelKey)}</b>
                      </p>
                      <p className="audit-row__target">
                        {entry.changedBy
                          ? t('detail.timeline.changedBy', { id: shortId(entry.changedBy) })
                          : t('detail.timeline.automatic')}
                        {entry.note ? ` · ${entry.note}` : ''}
                      </p>
                    </div>
                    <span className="audit-row__when">{formatBookingDate(entry.changedAt)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
