import { getTranslations } from 'next-intl/server'
import { CalendarCheck, Gauge, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { EmptyState } from '@/components/EmptyState'

export default async function AnalyticsPage() {
  const t = await getTranslations('insights')

  return (
    <>
      <PageHeader title={t('analytics.title')} description={t('analytics.description')} />

      <div className="stat-grid">
        <StatCard
          label={t('analytics.stats.totalRevenue.label')}
          value="—"
          hint={t('analytics.stats.totalRevenue.hint')}
          icon={Wallet}
          tone="warning"
          index={0}
        />
        <StatCard
          label={t('analytics.stats.bookings.label')}
          value="—"
          hint={t('analytics.stats.bookings.hint')}
          icon={CalendarCheck}
          tone="primary"
          index={1}
        />
        <StatCard
          label={t('analytics.stats.avgTicket.label')}
          value="—"
          hint={t('analytics.stats.avgTicket.hint')}
          icon={Gauge}
          tone="neutral"
          index={2}
        />
      </div>

      <div className="panel-row">
        <div className="panel-card">
          <div className="panel-card__header">
            <div>
              <h2 className="panel-card__title">{t('analytics.revenuePanel.title')}</h2>
              <p className="panel-card__subtitle text-secondary">{t('analytics.revenuePanel.subtitle')}</p>
            </div>
          </div>
          <div className="panel-card__body">
            <EmptyState
              title={t('analytics.revenuePanel.emptyTitle')}
              message={t('analytics.revenuePanel.emptyMessage')}
            />
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-card__header">
            <div>
              <h2 className="panel-card__title">{t('analytics.topFacilitiesPanel.title')}</h2>
              <p className="panel-card__subtitle text-secondary">{t('analytics.topFacilitiesPanel.subtitle')}</p>
            </div>
          </div>
          <div className="panel-card__body">
            <EmptyState
              title={t('analytics.topFacilitiesPanel.emptyTitle')}
              message={t('analytics.topFacilitiesPanel.emptyMessage')}
            />
          </div>
        </div>
      </div>
    </>
  )
}
