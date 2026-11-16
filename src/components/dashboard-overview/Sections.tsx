import { CalendarClock, Gauge } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import type { ReactNode } from 'react'
import type { BookingListResponse } from '@/lib/booking-api'
import { unwrap } from '@/lib/dashboard-overview-data'
import type { AnalyticsResult, Settled } from '@/lib/dashboard-overview-data'
import { KpiCard } from './KpiCard'
import type { KpiTone, KpiValue } from './KpiCard'
import { OccupancyGauge } from './OccupancyGauge'
import { RecentBookings } from './RecentBookings'
import { RevenueAreaChart } from './RevenueAreaChart'
import { SectionBoundary } from './SectionBoundary'
import { SectionCard } from './SectionCard'
import { SectionError } from './SectionError'
import { BookingsSkeleton, ChartSkeleton, GaugeSkeleton, KpiSkeleton } from './Skeletons'
import { StateBlock } from './StateBlock'

export interface KpiConfig {
  label: string
  hint: string
  icon: ReactNode
  tone: KpiTone
  index: number
  href?: string
  showBar?: boolean
  errorLabel: string
}

export interface KpiResult {
  data?: KpiValue
  sub?: string
}

function KpiFallback({ config }: { config: KpiConfig }) {
  return <KpiCard {...config} />
}

async function KpiResolved({
  config,
  result,
}: {
  config: KpiConfig
  result: Promise<Settled<KpiResult>>
}) {
  const { data, sub } = unwrap(await result)
  return <KpiCard {...config} data={data} sub={sub} />
}

export function KpiSection({
  config,
  result,
}: {
  config: KpiConfig
  result: Promise<Settled<KpiResult>>
}) {
  return (
    <SectionBoundary fallback={<KpiFallback config={config} />}>
      <Suspense fallback={<KpiSkeleton index={config.index} />}>
        <KpiResolved config={config} result={result} />
      </Suspense>
    </SectionBoundary>
  )
}

async function analyticsError(error: 'mixedCurrency' | 'unknown') {
  const t = await getTranslations('overview')
  return <SectionError message={t(`errors.${error}`)} retryable={error === 'unknown'} />
}

async function revenueCard(busy: boolean, body: ReactNode) {
  const t = await getTranslations('overview')
  return (
    <SectionCard
      titleId="ov-revenue-title"
      title={t('revenuePanel.title')}
      subtitle={t('revenuePanel.subtitle')}
      busy={busy}
    >
      <div className="ov-chart-body">{body}</div>
    </SectionCard>
  )
}

async function RevenueBody({ analytics }: { analytics: Promise<Settled<AnalyticsResult>> }) {
  const result = unwrap(await analytics)
  if (result.kind === 'error') return revenueCard(false, await analyticsError(result.error))
  const { series } = result
  return (
    <RevenueAreaChart points={series.points} currency={series.currency} bucket={series.bucket} />
  )
}

export async function RevenueSection({
  analytics,
}: {
  analytics: Promise<Settled<AnalyticsResult>>
}) {
  return (
    <SectionBoundary fallback={await revenueCard(false, <SectionError />)}>
      <Suspense fallback={await revenueCard(true, <ChartSkeleton />)}>
        <RevenueBody analytics={analytics} />
      </Suspense>
    </SectionBoundary>
  )
}

async function OccupancyBody({ analytics }: { analytics: Promise<Settled<AnalyticsResult>> }) {
  const t = await getTranslations('overview')
  const result = unwrap(await analytics)
  if (result.kind === 'error') return analyticsError(result.error)
  const { occupancy } = result.summary
  if (occupancy.capacitySlotMinutes <= 0) {
    return (
      <StateBlock
        icon={<Gauge size={26} strokeWidth={1.8} />}
        title={t('occupancyPanel.emptyTitle')}
        message={t('occupancyPanel.emptyMessage')}
      />
    )
  }
  return (
    <OccupancyGauge
      ratio={occupancy.ratio}
      bookedMinutes={occupancy.bookedSlotMinutes}
      capacityMinutes={occupancy.capacitySlotMinutes}
    />
  )
}

export async function OccupancySection({
  analytics,
}: {
  analytics: Promise<Settled<AnalyticsResult>>
}) {
  const t = await getTranslations('overview')
  return (
    <SectionCard
      titleId="ov-occupancy-title"
      title={t('occupancyPanel.title')}
      subtitle={t('occupancyPanel.subtitle')}
    >
      <div className="ov-occ-body">
        <SectionBoundary fallback={<SectionError />}>
          <Suspense fallback={<GaugeSkeleton />}>
            <OccupancyBody analytics={analytics} />
          </Suspense>
        </SectionBoundary>
      </div>
    </SectionCard>
  )
}

async function BookingsBody({
  bookings,
  basePath,
}: {
  bookings: Promise<Settled<BookingListResponse>>
  basePath: string
}) {
  const t = await getTranslations('overview')
  const { items } = unwrap(await bookings)
  if (items.length === 0) {
    return (
      <StateBlock
        icon={<CalendarClock size={26} strokeWidth={1.8} />}
        title={t('recentBookings.emptyTitle')}
        message={t('recentBookings.emptyMessage')}
      />
    )
  }
  return <RecentBookings items={items} basePath={basePath} />
}

export async function BookingsSection({
  bookings,
  basePath,
  viewAll,
}: {
  bookings: Promise<Settled<BookingListResponse>>
  basePath: string
  viewAll: ReactNode
}) {
  const t = await getTranslations('overview')
  return (
    <SectionCard
      titleId="ov-bookings-title"
      title={t('recentBookings.title')}
      subtitle={t('recentBookings.subtitle')}
      actions={viewAll}
    >
      <SectionBoundary fallback={<SectionError />}>
        <Suspense fallback={<BookingsSkeleton />}>
          <BookingsBody bookings={bookings} basePath={basePath} />
        </Suspense>
      </SectionBoundary>
    </SectionCard>
  )
}
