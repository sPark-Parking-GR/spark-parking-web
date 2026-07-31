import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { CalendarCheck, Gauge, Wallet, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { EmptyState } from '@/components/EmptyState'
import { RevenueChart } from '@/components/RevenueChart'
import { TopFacilitiesTable } from '@/components/TopFacilitiesTable'
import { DateRangeControl } from '@/components/DateRangeControl'
import { ApiError, AuthRequiredError } from '@/lib/api'
import {
  getAnalyticsSummary,
  getRevenueSeries,
  getTopFacilities,
  type AnalyticsSummary,
  type RevenueSeries,
  type TopFacilities,
} from '@/lib/analytics-api'
import { formatMoney } from '@/lib/booking-format'
import { buildQuery, requireSession } from '@/lib/dal'
import { parseRangePreset, resolveRange, type RangePreset } from '@/lib/date-range'

const TOP_FACILITIES_LIMIT = 10

type AnalyticsErrorKind = 'mixedCurrency' | 'unknown'

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  await requireSession()
  const t = await getTranslations('insights.analytics')

  const params = await searchParams
  const preset = parseRangePreset(params.range)
  const { from, to, bucket } = resolveRange(preset)

  let summary: AnalyticsSummary | null = null
  let series: RevenueSeries | null = null
  let topFacilities: TopFacilities | null = null
  let analyticsError: AnalyticsErrorKind | null = null

  try {
    const [summaryResult, seriesResult, topFacilitiesResult] = await Promise.all([
      getAnalyticsSummary({ from: from.toISOString(), to: to.toISOString() }),
      getRevenueSeries({ from: from.toISOString(), to: to.toISOString(), bucket }),
      getTopFacilities({
        from: from.toISOString(),
        to: to.toISOString(),
        limit: TOP_FACILITIES_LIMIT,
      }),
    ])
    summary = summaryResult
    series = seriesResult
    topFacilities = topFacilitiesResult
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
    analyticsError = err instanceof ApiError && err.status === 422 ? 'mixedCurrency' : 'unknown'
  }

  const buildHref = (nextPreset: RangePreset) =>
    buildQuery('/dashboard/analytics', { range: nextPreset === '30d' ? undefined : nextPreset })

  const errorBanner = analyticsError ? (
    <p className="form-banner form-banner--error" role="alert">
      <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
      {t(`errors.${analyticsError}`)}
    </p>
  ) : null

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <DateRangeControl active={preset} buildHref={buildHref} />

      <div className="stat-grid">
        <StatCard
          label={t('stats.totalRevenue.label')}
          value={summary ? formatMoney(summary.netRevenueCents, summary.currency) : '—'}
          hint={t('stats.totalRevenue.hint')}
          icon={Wallet}
          tone="warning"
          index={0}
        />
        <StatCard
          label={t('stats.bookings.label')}
          value={summary ? String(summary.bookingCount) : '—'}
          hint={t('stats.bookings.hint')}
          icon={CalendarCheck}
          tone="primary"
          index={1}
        />
        <StatCard
          label={t('stats.avgTicket.label')}
          value={summary ? formatMoney(summary.averageTicketCents, summary.currency) : '—'}
          hint={t('stats.avgTicket.hint')}
          icon={Gauge}
          tone="neutral"
          index={2}
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
            {errorBanner ??
              (series && series.points.length > 0 ? (
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
              ))}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-card__header">
            <div>
              <h2 className="panel-card__title">{t('topFacilitiesPanel.title')}</h2>
              <p className="panel-card__subtitle text-secondary">
                {t('topFacilitiesPanel.subtitle')}
              </p>
            </div>
          </div>
          <div className="panel-card__body">
            {errorBanner ??
              (topFacilities && topFacilities.items.length > 0 ? (
                <TopFacilitiesTable items={topFacilities.items} currency={topFacilities.currency} />
              ) : (
                <EmptyState
                  title={t('topFacilitiesPanel.emptyTitle')}
                  message={t('topFacilitiesPanel.emptyMessage')}
                />
              ))}
          </div>
        </div>
      </div>
    </>
  )
}
