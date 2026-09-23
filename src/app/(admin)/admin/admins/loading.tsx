import { PageHeader } from '@/components/PageHeader'
import {
  Skeleton,
  EditorSectionSkeleton,
  FieldSkeleton,
  TableSkeleton,
} from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="Admins" />
      <Skeleton width="60%" height={13} />
      <EditorSectionSkeleton headWidth={110}>
        <div className="field-grid">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </EditorSectionSkeleton>
      <TableSkeleton rows={6} columns={6} />
    </>
  )
}
