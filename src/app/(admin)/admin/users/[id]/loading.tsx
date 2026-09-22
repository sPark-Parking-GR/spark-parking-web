import { PageHeader } from '@/components/PageHeader'
import { Skeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <Skeleton width={120} height={16} radius={6} style={{ marginBottom: 'var(--space-md)' }} />
      <PageHeader title="" titleAccessory={<Skeleton width={220} height={28} radius={8} />} />
      <div className="operator-status-row">
        <Skeleton width={140} height={26} radius={999} />
        <Skeleton width={140} height={26} radius={999} />
      </div>
      <div className="panel-card panel-card--wide">
        <div className="panel-card__body">
          <TableSkeleton rows={3} columns={2} />
        </div>
      </div>
      <div className="panel-card panel-card--wide">
        <div className="panel-card__body">
          <TableSkeleton rows={3} columns={2} />
        </div>
      </div>
    </>
  )
}
