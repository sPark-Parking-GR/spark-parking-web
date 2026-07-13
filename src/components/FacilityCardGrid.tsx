import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import { SparkMark } from './SparkMark'
import { KIND_META } from '@/lib/facility-display'
import type { AdminFacilityListItem } from '@/lib/api'

interface Props {
  items: AdminFacilityListItem[]
}

export async function FacilityCardGrid({ items }: Props) {
  const t = await getTranslations('facilities')
  return (
    <div className="facility-card-grid">
      {items.map((item) => {
        const kind = KIND_META[item.kind]
        return (
          <Link
            key={item.id}
            href={`/dashboard/facilities/${item.id}`}
            className="facility-card"
          >
            <div className="facility-card__header">
              <span className="facility-card__icon">
                <SparkMark size={22} />
              </span>
              <div className="facility-card__identity">
                <span className="facility-card__name">{item.name}</span>
                <span className="facility-card__address">{item.address}</span>
              </div>
            </div>

            <div className="facility-card__badges">
              <Badge variant={item.isActive ? 'ok' : 'warn'}>
                {item.isActive ? t('status.active') : t('status.inactive')}
              </Badge>
              <Badge variant={item.isVerified ? 'ok' : 'warn'}>
                {item.isVerified ? t('status.verified') : t('status.pending')}
              </Badge>
              <span className={`badge ${kind.badge}`}>{kind.label}</span>
            </div>

            <div className="facility-card__divider" />

            <div className="facility-card__stats">
              <div className="facility-card__stat">
                <span className="facility-card__stat-value">{item.totalCapacity}</span>
                <span className="facility-card__stat-label">{t('stats.totalSpots')}</span>
              </div>
              <div className="facility-card__stat">
                <span className="facility-card__stat-value">{item.onlineQuota}</span>
                <span className="facility-card__stat-label">{t('stats.onlineQuota')}</span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
