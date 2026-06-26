import { PageHeader } from '@/components/PageHeader'
import { Skeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="Bookings" description="Track reservations and run check-in / check-out." />
      <div className="tabs">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width={84} height={20} />
        ))}
      </div>
      <div className="table-toolbar">
        <Skeleton width={280} height={42} radius={14} />
        <Skeleton width={84} height={14} className="table-toolbar__count" />
      </div>
      <TableSkeleton rows={8} columns={7} />
    </>
  )
}
