import { getTranslations } from 'next-intl/server'
import { Skeleton, FieldSkeleton, EditorSectionSkeleton } from '@/components/Skeleton'

export async function FacilityFormSkeleton() {
  const t = await getTranslations('facilities')
  return (
    <div className="facility-form-layout" role="status" aria-label={t('form.loadingAria')}>
      <div className="facility-form-card">
        <EditorSectionSkeleton headWidth={64}>
          <div className="field-grid">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
        </EditorSectionSkeleton>

        <EditorSectionSkeleton headWidth={84}>
          <div className="field-grid">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
        </EditorSectionSkeleton>

        <EditorSectionSkeleton headWidth={150}>
          <div className="field-grid">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
          <FieldSkeleton />
        </EditorSectionSkeleton>

        <EditorSectionSkeleton headWidth={150}>
          <FieldSkeleton />
          <div className="field">
            <Skeleton width={96} height={13} className="field__label" />
            <Skeleton height={84} radius={8} />
          </div>
        </EditorSectionSkeleton>

        <div className="form-actions">
          <Skeleton width={140} height={44} radius={10} />
        </div>
      </div>

      <aside className="facility-map-panel">
        <Skeleton height={480} radius={12} />
        <Skeleton width="70%" height={13} />
      </aside>
    </div>
  )
}
