import { getTranslations } from 'next-intl/server'
import { Badge, Card, ProgressRing } from '@spark/ui'
import { MapPin } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import { VEHICLE_ICON } from '@/components/vehicle-icons'
import type { AdminFacility } from '@/lib/api'
import type { VehicleType } from '@spark/types'

const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

function hourFraction(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(':').map(Number)
  return h + m / 60
}

export async function FacilityOverviewPanel({ facility }: { facility: AdminFacility }) {
  const t = await getTranslations('facilities')

  const hoursRows = WEEKDAYS.map((day) => {
    const entry = facility.openingHours.is24h ? null : facility.openingHours.schedule?.[day]
    const leftPct = facility.openingHours.is24h
      ? 0
      : entry
        ? Math.min(100, (hourFraction(entry.open) / 24) * 100)
        : 0
    const rightPct = facility.openingHours.is24h
      ? 0
      : entry
        ? Math.max(0, ((24 - hourFraction(entry.close)) / 24) * 100)
        : 100
    const label = facility.openingHours.is24h
      ? t('overview.open24h')
      : entry
        ? `${entry.open}–${entry.close}`
        : t('overview.closed')
    return { day, leftPct, rightPct, label }
  })

  const onlinePct =
    facility.totalCapacity > 0
      ? Math.round((facility.onlineQuota / facility.totalCapacity) * 100)
      : 0

  return (
    <>
      <Card padding={22} style={{ marginBottom: 24 }}>
        <div className="facility-overview__header">
          <span className="facility-overview__icon" aria-hidden="true">
            <SparkMark size={22} />
          </span>
          <div className="facility-overview__identity">
            <h2 className="h-heading">{facility.name}</h2>
            <p className="text-secondary facility-overview__address">
              <MapPin size={14} strokeWidth={2} aria-hidden="true" />
              {facility.address}
            </p>
          </div>
          <div className="facility-overview__badges">
            <Badge variant={facility.isActive ? 'ok' : 'neutral'}>
              {facility.isActive ? t('status.active') : t('status.inactive')}
            </Badge>
            <Badge variant={facility.isPublished ? 'ok' : 'warn'}>
              {facility.isPublished ? t('status.published') : t('status.unpublished')}
            </Badge>
          </div>
        </div>

        <div className="capacity-summary">
          <div className="capacity-summary__figure">
            <span className="capacity-summary__number">{facility.totalCapacity}</span>
            <span className="capacity-summary__label">{t('stats.totalSpots')}</span>
          </div>

          <div className="capacity-summary__divider" aria-hidden="true" />

          <div className="capacity-summary__figure">
            <span className="capacity-summary__number">{facility.onlineQuota}</span>
            <span className="capacity-summary__label">{t('stats.onlineQuota')}</span>
          </div>

          <div className="capacity-summary__divider" aria-hidden="true" />

          <div className="capacity-summary__segment">
            <span className="capacity-summary__label">{t('stats.vehicleTypes')}</span>
            {facility.vehicleTypes.length === 0 ? (
              <span className="text-secondary">—</span>
            ) : (
              <div className="capacity-summary__pills">
                {facility.vehicleTypes.map((vehicleType) => {
                  const Icon = VEHICLE_ICON[vehicleType.toLowerCase() as VehicleType]
                  return (
                    <span key={vehicleType} className="capacity-summary__pill">
                      <Icon size={14} strokeWidth={2} aria-hidden="true" />
                      {t(`vehicleTypes.${vehicleType.toLowerCase()}`)}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="panel-row">
        <Card>
          <h3 className="panel-card__title facility-overview__section-title">
            {t('overview.activeHours')}
          </h3>
          <p className="text-secondary facility-overview__hours-sub">
            {t('overview.activeHoursSub')}
          </p>
          <div className="facility-hours-list">
            {hoursRows.map((row) => (
              <div key={row.day} className="facility-hours-row">
                <span className="facility-hours-row__day">{t(`overview.days.${row.day}`)}</span>
                <div className="facility-hours-row__track">
                  <div
                    className="facility-hours-row__fill"
                    style={{ left: `${row.leftPct}%`, right: `${row.rightPct}%` }}
                  />
                </div>
                <span className="facility-hours-row__label">{row.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="panel-card__title facility-overview__section-title">
            {t('overview.onlineAvailability')}
          </h3>
          <div className="facility-overview__ring">
            <ProgressRing pct={onlinePct}>
              <span className="facility-overview__ring-value">{onlinePct}%</span>
            </ProgressRing>
            <p className="text-secondary facility-overview__ring-hint">
              {t('overview.ringHint', {
                onlineQuota: facility.onlineQuota,
                totalCapacity: facility.totalCapacity,
              })}
            </p>
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 24 }}>
        <h3 className="panel-card__title facility-overview__section-title">
          {t('overview.amenities')}
        </h3>
        {facility.amenities.length === 0 ? (
          <p className="text-secondary">{t('overview.noAmenities')}</p>
        ) : (
          <div className="facility-overview__chips">
            {facility.amenities.map((amenity) => (
              <span key={amenity} className="facility-overview__chip">
                {amenity}
              </span>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
