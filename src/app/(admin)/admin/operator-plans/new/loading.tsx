import { PageHeader } from '@/components/PageHeader'
import { OperatorPlanEditorSkeleton } from '@/components/OperatorPlanEditorSkeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="New operator plan" />
      <OperatorPlanEditorSkeleton />
    </>
  )
}
