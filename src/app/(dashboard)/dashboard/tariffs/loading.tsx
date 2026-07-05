import { PageHeader } from '@/components/PageHeader'
import { Skeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="Tariffs" description="Pick a facility to view and edit its pricing plans." />
      <div className="table-toolbar">
        <Skeleton width={280} height={42} radius={14} />
      </div>
      <div className="table-toolbar table-toolbar--filters">
        <Skeleton width={150} height={40} radius={12} />
        <Skeleton width={150} height={40} radius={12} />
        <Skeleton width={150} height={40} radius={12} />
      </div>
      <TableSkeleton rows={8} columns={6} />
    </>
  )
}
