import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeleton'
import { DriverPlanEditorSkeleton } from '@/components/DriverPlanEditorSkeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="" titleAccessory={<Skeleton width={220} height={28} radius={8} />} />
      <DriverPlanEditorSkeleton />
    </>
  )
}
