import { PageHeader } from '@/components/PageHeader'
import { Skeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="Tariffs" description="Pick a facility, then configure its pricing plans." />
      <div className="table-toolbar">
        <Skeleton width={320} height={62} radius={14} />
      </div>
      <TableSkeleton rows={5} columns={6} />
    </>
  )
}
