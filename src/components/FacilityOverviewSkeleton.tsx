import { Card } from '@spark/ui'
import { Skeleton } from '@/components/Skeleton'

const DAY_COUNT = 7

export function FacilityOverviewSkeleton() {
  return (
    <div role="status" aria-label="Loading facility overview">
      <Card padding={22} style={{ marginBottom: 24 }}>
        <div className="facility-overview__header">
          <Skeleton width={40} height={40} radius={10} />
          <div className="facility-overview__identity">
            <Skeleton width={220} height={20} />
            <Skeleton width={160} height={14} className="facility-overview__address" />
          </div>
          <div className="facility-overview__badges">
            <Skeleton width={64} height={24} radius={999} />
            <Skeleton width={72} height={24} radius={999} />
          </div>
        </div>

        <div className="stat-grid facility-overview__stats">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={84} radius={12} />
          ))}
        </div>
      </Card>

      <div className="panel-row">
        <Card>
          <Skeleton width={110} height={16} className="facility-overview__section-title" />
          <Skeleton width={200} height={13} style={{ marginTop: 6, marginBottom: 14 }} />
          <div className="facility-hours-list">
            {Array.from({ length: DAY_COUNT }).map((_, i) => (
              <div key={i} className="facility-hours-row">
                <Skeleton width={70} height={13} />
                <Skeleton height={8} radius={4} style={{ flex: 1, margin: '0 12px' }} />
                <Skeleton width={90} height={13} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Skeleton width={140} height={16} className="facility-overview__section-title" />
          <div className="facility-overview__ring">
            <Skeleton width={140} height={140} radius={999} />
            <Skeleton width={160} height={13} style={{ marginTop: 12 }} />
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 24 }}>
        <Skeleton width={90} height={16} className="facility-overview__section-title" />
        <div className="facility-overview__chips" style={{ marginTop: 10 }}>
          <Skeleton width={80} height={26} radius={999} />
          <Skeleton width={100} height={26} radius={999} />
          <Skeleton width={70} height={26} radius={999} />
        </div>
      </Card>
    </div>
  )
}
