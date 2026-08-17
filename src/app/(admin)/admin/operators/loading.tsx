import { PageHeader } from '@/components/PageHeader'
import { Skeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="Operators" />
      <div className="stat-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={94} radius={20} />
        ))}
      </div>
      <div className="table-toolbar">
        <Skeleton width={280} height={42} radius={14} />
        <Skeleton width={150} height={40} radius={12} />
      </div>
      <TableSkeleton rows={6} columns={6} />
    </>
  )
}
