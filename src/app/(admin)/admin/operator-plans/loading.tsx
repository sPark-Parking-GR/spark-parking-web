import { PageHeader } from '@/components/PageHeader'
import { Skeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <PageHeader
        title="Operator plans"
        description="Subscription plans operators can be placed on."
      />
      <div className="table-toolbar table-toolbar--count">
        <Skeleton width={90} height={13} />
      </div>
      <TableSkeleton rows={6} columns={8} />
    </>
  )
}
