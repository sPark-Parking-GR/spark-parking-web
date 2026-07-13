import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Building2, CalendarCheck, Gauge, Wallet } from 'lucide-react'
import { ProgressBar } from '@spark/ui'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { EmptyState } from '@/components/EmptyState'
import { listFacilities } from '@/lib/api'
import { listBookings } from '@/lib/booking-api'
import { loadPage, requireSession } from '@/lib/dal'

const STATUS_FACILITY_COUNT = 5

export default async function DashboardOverviewPage() {
  await requireSession()
  const t = await getTranslations('overview')

  const [facilities, activeBookings] = await Promise.all([
    loadPage(() => listFacilities({ take: STATUS_FACILITY_COUNT })),
    loadPage(() => listBookings({ status: 'CHECKED_IN', take: 1 })),
  ])

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="stat-grid">
        <StatCard
          label={t('stats.facilities.label')}
          value={String(facilities.total)}
          hint={t('stats.facilities.hint')}
          icon={Building2}
          tone="primary"
          index={0}
        />
        <StatCard
          label={t('stats.activeBookings.label')}
          value={String(activeBookings.total)}
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
            {facilities.items.length === 0 ? (
              <EmptyState
                title={t('occupancyPanel.emptyTitle')}
                message={t('occupancyPanel.emptyMessage')}
              />
            ) : (
              <div className="facility-status-list">
                {facilities.items.map((facility) => {
                  const pct =
                    facility.totalCapacity > 0
                      ? Math.round((facility.onlineQuota / facility.totalCapacity) * 100)
                      : 0
                  return (
                    <div key={facility.id} className="facility-status-row">
                      <div className="facility-status-row__main">
                        <div className="facility-status-row__name">{facility.name}</div>
                        <ProgressBar pct={pct} />
                      </div>
                      <div className="facility-status-row__figures">
                        <div className="facility-status-row__pct">{pct}%</div>
                        <div className="facility-status-row__free">
                          {t('occupancyPanel.free', { count: facility.onlineQuota })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
