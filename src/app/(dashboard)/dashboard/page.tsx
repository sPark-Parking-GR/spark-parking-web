import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Building2, CalendarCheck, Gauge, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { EmptyState } from '@/components/EmptyState'

export default async function DashboardOverviewPage() {
  const t = await getTranslations('overview')

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="stat-grid">
        <StatCard
          label={t('stats.facilities.label')}
          value="—"
          hint={t('stats.facilities.hint')}
          icon={Building2}
          tone="primary"
          index={0}
        />
        <StatCard
          label={t('stats.activeBookings.label')}
          value="—"
          hint={t('stats.activeBookings.hint')}
          icon={CalendarCheck}
          tone="success"
          index={1}
        />
        <StatCard
          label={t('stats.revenueToday.label')}
          value="—"
          hint={t('stats.revenueToday.hint')}
          icon={Wallet}
          tone="warning"
          index={2}
        />
        <StatCard
          label={t('stats.avgOccupancy.label')}
          value="—"
          hint={t('stats.avgOccupancy.hint')}
          icon={Gauge}
          tone="neutral"
          index={3}
        />
      </div>

      <div className="panel-row">
        <div className="panel-card">
          <div className="panel-card__header">
            <div>
              <h2 className="panel-card__title">{t('revenuePanel.title')}</h2>
              <p className="panel-card__subtitle text-secondary">{t('revenuePanel.subtitle')}</p>
            </div>
          </div>
          <div className="panel-card__body">
            <EmptyState
              title={t('revenuePanel.emptyTitle')}
              message={t('revenuePanel.emptyMessage')}
            />
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-card__header">
            <div>
              <h2 className="panel-card__title">{t('occupancyPanel.title')}</h2>
              <p className="panel-card__subtitle text-secondary">{t('occupancyPanel.subtitle')}</p>
            </div>
          </div>
          <div className="panel-card__body">
            <EmptyState
              title={t('occupancyPanel.emptyTitle')}
              message={t('occupancyPanel.emptyMessage')}
            />
          </div>
        </div>
      </div>

      <div className="panel-card panel-card--wide">
        <div className="panel-card__header">
          <div>
            <h2 className="panel-card__title">{t('recentBookings.title')}</h2>
            <p className="panel-card__subtitle text-secondary">{t('recentBookings.subtitle')}</p>
          </div>
          <Link href="/dashboard/bookings" className="panel-card__link">
            {t('recentBookings.viewAll')}
          </Link>
        </div>
        <div className="panel-card__body">
          <EmptyState
            title={t('recentBookings.emptyTitle')}
            message={t('recentBookings.emptyMessage')}
          />
        </div>
      </div>
    </>
  )
}
