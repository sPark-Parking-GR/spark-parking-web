import { Skeleton, FieldSkeleton, EditorSectionSkeleton } from '@/components/Skeleton'

export function TariffEditorSkeleton() {
  return (
    <div className="tariff-editor" role="status" aria-label="Loading tariff plan">
      <div className="tariff-editor__left">
        <EditorSectionSkeleton headWidth={96}>
          <div className="field-grid">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
          <div className="field-grid">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
        </EditorSectionSkeleton>

        <EditorSectionSkeleton headWidth={84}>
          <Skeleton height={64} radius={8} />
        </EditorSectionSkeleton>

        <EditorSectionSkeleton headWidth={64}>
          <Skeleton height={64} radius={8} />
        </EditorSectionSkeleton>

        <EditorSectionSkeleton headWidth={110}>
          <Skeleton height={140} radius={8} />
        </EditorSectionSkeleton>

        <EditorSectionSkeleton headWidth={64}>
          <Skeleton height={64} radius={8} />
        </EditorSectionSkeleton>

        <div className="form-actions">
          <Skeleton width={140} height={44} radius={10} />
        </div>
      </div>

      <div className="tariff-editor__right">
        <aside className="simulator">
          <div className="simulator__head">
            <Skeleton width={96} height={16} />
          </div>
          <div className="simulator__dates">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
          <div className="field">
            <Skeleton width={96} height={13} className="field__label" />
            <Skeleton height={44} radius={8} />
          </div>
          <Skeleton height={160} radius={8} />
        </aside>
      </div>
    </div>
  )
}
