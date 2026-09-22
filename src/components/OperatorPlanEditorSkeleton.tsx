import { Skeleton, FieldSkeleton, EditorSectionSkeleton } from '@/components/Skeleton'

export function OperatorPlanEditorSkeleton() {
  return (
    <div className="facility-form-card" role="status" aria-label="Loading operator plan">
      <EditorSectionSkeleton headWidth={96}>
        <div className="field-grid">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
        <FieldSkeleton />
        <div className="field-grid">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
        <FieldSkeleton />
      </EditorSectionSkeleton>

      <EditorSectionSkeleton headWidth={110}>
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <Skeleton height={96} radius={8} />
      </EditorSectionSkeleton>

      <EditorSectionSkeleton headWidth={80}>
        <FieldSkeleton />
        <FieldSkeleton />
      </EditorSectionSkeleton>

      <div className="form-actions">
        <Skeleton width={140} height={44} radius={10} />
      </div>
    </div>
  )
}
