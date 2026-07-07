import { getTranslations } from 'next-intl/server'
import { Badge, Card, ProgressRing } from '@spark/ui'
import { MapPin, Car } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { SparkMark } from '@/components/SparkMark'
import type { AdminFacility } from '@/lib/api'

export async function FacilityOverviewPanel({ facility }: { facility: AdminFacility }) {
  const t = await getTranslations('facilities')

  const formatHours = (facility: AdminFacility): string => {
    if (facility.openingHours.is24h) return t('overview.open24h')
    const schedule = facility.openingHours.schedule
    const first = schedule ? Object.values(schedule).find(Boolean) : null
    if (!first) return t('overview.hoursNotSet')
    return `${first.open} – ${first.close}`
  }

  const onlinePct =
    facility.totalCapacity > 0
      ? Math.round((facility.onlineQuota / facility.totalCapacity) * 100)
      : 0

  return (
    <>
      <Card style={{ marginBottom: 24 }}>
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
            <Badge variant={facility.isVerified ? 'ok' : 'warn'}>
              {facility.isVerified ? t('status.verified') : t('status.pendingVerification')}
            </Badge>
          </div>
        </div>

        <div className="stat-grid facility-overview__stats">
          <StatCard label={t('stats.totalSpots')} value={String(facility.totalCapacity)} icon={Car} tone="primary" />
          <StatCard label={t('stats.onlineQuota')} value={String(facility.onlineQuota)} icon={Car} tone="success" index={1} />
          <StatCard
            label={t('stats.vehicleTypes')}
            value={
              facility.vehicleTypes.length <= 2
                ? facility.vehicleTypes.join(', ') || '—'
                : String(facility.vehicleTypes.length)
            }
            tone="neutral"
            index={2}
          />
        </div>
      </Card>

      <div className="panel-row">
        <Card>
          <h3 className="panel-card__title facility-overview__section-title">{t('overview.onlineAvailability')}</h3>
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

        <Card>
          <h3 className="panel-card__title facility-overview__section-title">{t('overview.activeHours')}</h3>
          <p className="text-secondary">{formatHours(facility)}</p>
        </Card>
      </div>

      <Card style={{ marginTop: 24 }}>
        <h3 className="panel-card__title facility-overview__section-title">{t('overview.amenities')}</h3>
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
