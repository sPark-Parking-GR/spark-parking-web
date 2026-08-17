import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeleton'
import { FacilityCardGridSkeleton } from '@/components/FacilityCardGridSkeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="Facilities" />
      <div className="table-toolbar">
        <Skeleton width={280} height={42} radius={14} />
        <Skeleton width={180} height={40} radius={12} className="view-toggle" />
      </div>
      <div className="table-toolbar table-toolbar--filters">
        <Skeleton width={150} height={40} radius={12} />
        <Skeleton width={150} height={40} radius={12} />
        <Skeleton width={150} height={40} radius={12} />
      </div>
      <FacilityCardGridSkeleton />
    </>
  )
}
