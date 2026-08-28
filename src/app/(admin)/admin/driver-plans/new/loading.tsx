import { PageHeader } from '@/components/PageHeader'
import { DriverPlanEditorSkeleton } from '@/components/DriverPlanEditorSkeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="New driver plan" />
      <DriverPlanEditorSkeleton />
    </>
  )
}
