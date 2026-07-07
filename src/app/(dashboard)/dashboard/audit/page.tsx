import { getTranslations } from 'next-intl/server'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'

export default async function AuditPage() {
  const t = await getTranslations('insights')

  return (
    <>
      <PageHeader title={t('audit.title')} description={t('audit.description')} />

      <div className="panel-card panel-card--wide">
        <div className="panel-card__header">
          <div>
            <h2 className="panel-card__title">{t('audit.activityPanel.title')}</h2>
            <p className="panel-card__subtitle text-secondary">{t('audit.activityPanel.subtitle')}</p>
          </div>
        </div>
        <div className="panel-card__body">
          <EmptyState title={t('audit.emptyTitle')} message={t('audit.emptyMessage')} />
        </div>
      </div>
    </>
  )
}
