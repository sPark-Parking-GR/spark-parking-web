import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Building2, CalendarCheck, Gauge, Wallet, AlertCircle } from 'lucide-react'
import { ProgressBar } from '@spark/ui'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { EmptyState } from '@/components/EmptyState'
import { BookingTable } from '@/components/BookingTable'
import { RevenueChart } from '@/components/RevenueChart'
import { DateRangeControl } from '@/components/DateRangeControl'
import { isPlatformRole } from '@spark/types'
import { listFacilities, ApiError, AuthRequiredError } from '@/lib/api'
import { listBookings } from '@/lib/booking-api'
import { getAnalyticsSummary, getRevenueSeries } from '@/lib/analytics-api'
import type { AnalyticsSummary, RevenueSeries } from '@/lib/analytics-api'
import { formatMoney } from '@/lib/booking-format'
import { formatRatio, formatHours } from '@/lib/analytics-format'
import { buildQuery, loadPage, requireSession } from '@/lib/dal'
import { parseRangePreset, resolveRange, type RangePreset } from '@/lib/date-range'

const STATUS_FACILITY_COUNT = 5
const RECENT_BOOKINGS_COUNT = 5

type AnalyticsErrorKind = 'mixedCurrency' | 'unknown'

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function DashboardOverviewPage({ searchParams }: PageProps) {
  const session = await requireSession()
  const t = await getTranslations('overview')
  const bookingsHref = isPlatformRole(session.user.role) ? '/admin/bookings' : '/dashboard/bookings'

  const params = await searchParams
  const preset = parseRangePreset(params.range)
  const { from, to, bucket } = resolveRange(preset)

  let summary: AnalyticsSummary | null = null
  let series: RevenueSeries | null = null
  let analyticsError: AnalyticsErrorKind | null = null

  try {
    const [summaryResult, seriesResult] = await Promise.all([
      getAnalyticsSummary({ from: from.toISOString(), to: to.toISOString() }),
      getRevenueSeries({ from: from.toISOString(), to: to.toISOString(), bucket }),
    ])
    summary = summaryResult
    series = seriesResult
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
    analyticsError = err instanceof ApiError && err.status === 422 ? 'mixedCurrency' : 'unknown'
  }

  const [facilities, activeBookings, recentBookings] = await Promise.all([
    loadPage(() => listFacilities({ take: STATUS_FACILITY_COUNT })),
    loadPage(() => listBookings({ status: 'CHECKED_IN', take: 1 })),
    loadPage(() => listBookings({ take: RECENT_BOOKINGS_COUNT })),
  ])

  const buildHref = (nextPreset: RangePreset) =>
    buildQuery('/dashboard', { range: nextPreset === '30d' ? undefined : nextPreset })

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <DateRangeControl active={preset} buildHref={buildHref} />

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
          label={t('stats.revenue.label')}
          value={summary ? formatMoney(summary.netRevenueCents, summary.currency) : '—'}
          hint={t('stats.revenue.hint')}
          icon={Wallet}
          tone="warning"
          index={2}
        />
        <StatCard
          label={t('stats.avgOccupancy.label')}
          value={summary ? formatRatio(summary.occupancy.ratio) : '—'}
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
            {analyticsError ? (
              <p className="form-banner form-banner--error" role="alert">
                <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
                {t(`errors.${analyticsError}`)}
              </p>
            ) : series && series.points.length > 0 ? (
              <RevenueChart
                points={series.points}
                currency={series.currency}
                bucket={series.bucket}
                ariaLabel={t('revenuePanel.chartLabel')}
              />
            ) : (
              <EmptyState
                title={t('revenuePanel.emptyTitle')}
                message={t('revenuePanel.emptyMessage')}
              />
            )}
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
            {analyticsError ? (
              <p className="form-banner form-banner--error" role="alert">
                <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
                {t(`errors.${analyticsError}`)}
              </p>
            ) : summary && summary.occupancy.capacitySlotMinutes > 0 ? (
              <div className="occupancy-summary">
                <span className="occupancy-summary__figure">
                  {formatRatio(summary.occupancy.ratio)}
                </span>
                <ProgressBar pct={Math.round(summary.occupancy.ratio * 100)} />
                <p className="text-secondary occupancy-summary__detail">
                  {t('occupancyPanel.detail', {
                    booked: formatHours(summary.occupancy.bookedSlotMinutes),
                    capacity: formatHours(summary.occupancy.capacitySlotMinutes),
                  })}
                </p>
              </div>
            ) : (
              <EmptyState
                title={t('occupancyPanel.emptyTitle')}
                message={t('occupancyPanel.emptyMessage')}
              />
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
          <Link href={bookingsHref} className="panel-card__link">
            {t('recentBookings.viewAll')}
          </Link>
        </div>
        <div className="panel-card__body">
          {recentBookings.items.length === 0 ? (
            <EmptyState
              title={t('recentBookings.emptyTitle')}
              message={t('recentBookings.emptyMessage')}
            />
          ) : (
            <BookingTable items={recentBookings.items} basePath={bookingsHref} />
          )}
        </div>
      </div>
    </>
  )
}
