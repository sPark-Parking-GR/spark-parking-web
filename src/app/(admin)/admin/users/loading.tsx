import { PageHeader } from '@/components/PageHeader'
import { Skeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="Users" />
      <div className="table-toolbar">
        <Skeleton width={280} height={42} radius={14} />
      </div>
      <div className="table-toolbar table-toolbar--filters">
        <Skeleton width={150} height={40} radius={12} />
        <Skeleton width={150} height={40} radius={12} />
      </div>
      <TableSkeleton rows={6} columns={5} />
    </>
  )
}
