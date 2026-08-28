import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeleton'
import { OperatorPlanEditorSkeleton } from '@/components/OperatorPlanEditorSkeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="" titleAccessory={<Skeleton width={220} height={28} radius={8} />} />
      <OperatorPlanEditorSkeleton />
    </>
  )
}
