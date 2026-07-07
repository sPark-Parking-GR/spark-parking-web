import { getTranslations } from 'next-intl/server'
import { UserPlus } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'

export default async function OperatorsPage() {
  const t = await getTranslations('insights')

  return (
    <>
      <PageHeader
        title={t('operators.title')}
        description={t('operators.description')}
        actions={
          <button type="button" className="btn btn--primary" disabled>
            <UserPlus size={16} strokeWidth={2.25} aria-hidden="true" />
            {t('operators.invite')}
          </button>
        }
      />

      <div className="panel-card panel-card--wide">
        <div className="panel-card__body">
          <EmptyState title={t('operators.emptyTitle')} message={t('operators.emptyMessage')} />
        </div>
      </div>
    </>
  )
}
