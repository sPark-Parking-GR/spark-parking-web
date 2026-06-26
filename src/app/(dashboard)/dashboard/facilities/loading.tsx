import { PageHeader } from '@/components/PageHeader'
import { Skeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="Facilities" />
      <div className="table-toolbar">
        <Skeleton width={280} height={42} radius={14} />
        <Skeleton width={90} height={14} className="table-toolbar__count" />
      </div>
      <TableSkeleton rows={8} columns={5} />
    </>
  )
}
