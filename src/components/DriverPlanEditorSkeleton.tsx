import { Skeleton, FieldSkeleton, EditorSectionSkeleton } from '@/components/Skeleton'

export function DriverPlanEditorSkeleton() {
  return (
    <div className="driver-plan-editor" role="status" aria-label="Loading driver plan">
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
        <div className="field-grid">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </EditorSectionSkeleton>

      <EditorSectionSkeleton headWidth={110}>
        <div className="field-grid">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
        <Skeleton height={64} radius={8} />
      </EditorSectionSkeleton>

      <div className="form-actions">
        <Skeleton width={140} height={44} radius={10} />
      </div>
    </div>
  )
}
