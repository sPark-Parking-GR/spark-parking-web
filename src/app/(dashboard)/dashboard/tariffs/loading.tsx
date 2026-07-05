import { PageHeader } from '@/components/PageHeader'
import { Skeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="Tariffs" description="Manage pricing plans and assign them to facilities." />
      <div className="table-toolbar">
        <Skeleton width={280} height={42} radius={14} />
      </div>
      <TableSkeleton rows={8} columns={6} />
    </>
  )
}
