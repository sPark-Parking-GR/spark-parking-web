import { PageHeader } from '@/components/PageHeader'
import { Skeleton, EditorSectionSkeleton, FieldSkeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="Team" />
      <Skeleton width="60%" height={13} />
      <EditorSectionSkeleton headWidth={140}>
        <div className="field-grid">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </EditorSectionSkeleton>
      <TableSkeleton rows={4} columns={5} />
      <Skeleton width={120} height={16} />
      <TableSkeleton rows={2} columns={5} />
    </>
  )
}
