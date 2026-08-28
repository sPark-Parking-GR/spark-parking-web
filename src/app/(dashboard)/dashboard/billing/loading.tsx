import { PageHeader } from '@/components/PageHeader'
import { Skeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="Plan & billing" />

      <div className="panel-card panel-card--wide">
        <div className="panel-card__header">
          <Skeleton width={160} height={16} />
        </div>
        <div className="panel-card__body panel-card__body--stack">
          <div className="operator-detail-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="operator-detail-grid__item" key={i}>
                <Skeleton width={90} height={11} />
                <Skeleton width={130} height={15} />
              </div>
            ))}
          </div>
          <TableSkeleton rows={3} columns={2} />
        </div>
      </div>

      <Skeleton width={140} height={16} />

      <div className="plan-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="card plan-card" key={i}>
            <Skeleton width="55%" height={16} />
            <Skeleton width="40%" height={22} />
            <Skeleton height={13} />
            <Skeleton height={13} />
            <Skeleton height={13} />
            <Skeleton height={38} radius={10} />
          </div>
        ))}
      </div>
    </>
  )
}
