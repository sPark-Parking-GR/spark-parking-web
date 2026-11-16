import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, Building2, CalendarCheck, Gauge, Gem, Tags, Wallet } from 'lucide-react'
import { isPlatformRole } from '@spark/types'
import { PeriodControl } from '@/components/dashboard-overview/PeriodControl'
import {
  BookingsSection,
  KpiSection,
  OccupancySection,
  RevenueSection,
} from '@/components/dashboard-overview/Sections'
import type { KpiConfig, KpiResult } from '@/components/dashboard-overview/Sections'
import { listFacilities } from '@/lib/api'
import { listBookings } from '@/lib/booking-api'
import { listTariffPlans } from '@/lib/tariff-api'
import { getMyOperatorSubscription } from '@/lib/operator-subscription-api'
import type { MyOperatorSubscription } from '@/lib/operator-subscription-api'
import { loadAnalytics, settle, unwrap } from '@/lib/dashboard-overview-data'
import { buildQuery, loadPage, requireSession } from '@/lib/dal'
import { canAccessBilling } from '@/lib/system-flags-api'
import { RANGE_PRESETS, parseRangePreset, resolveRange } from '@/lib/date-range'
import type { RangePreset } from '@/lib/date-range'
import type { Settled } from '@/lib/dashboard-overview-data'

const STATUS_FACILITY_COUNT = 5
const RECENT_BOOKINGS_COUNT = 5

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function DashboardOverviewPage({ searchParams }: PageProps) {
  const session = await requireSession()
  const t = await getTranslations('overview')
  const tBilling = await getTranslations('billing')
  const billingVisible = await canAccessBilling(session.user.role)
  const platform = isPlatformRole(session.user.role)
  const facilitiesHref = platform ? '/admin/facilities' : '/dashboard/facilities'
  const bookingsHref = platform ? '/admin/bookings' : '/dashboard/bookings'

  const params = await searchParams
  const preset = parseRangePreset(params.range)
  const range = resolveRange(preset)

  // Owner-only: /operator-subscriptions/me refuses a STAFF caller, and staff have no
  // business seeing what the operator pays either way.
  const subscriptionRequest =
    billingVisible && session.user.role === 'operator_admin'
      ? getMyOperatorSubscription().catch((): MyOperatorSubscription | null => null)
      : Promise.resolve<MyOperatorSubscription | null>(null)

  // Tariffs stay visible with billing off. A role without tariff access just loses the card.
  const tariffRequest = listTariffPlans().then(
    ({ items }) => ({ active: items.filter((p) => p.isActive).length, total: items.length }),
    () => null,
  )

  const analytics = billingVisible ? settle(() => loadAnalytics(range)) : null
  const facilities = settle(() => loadPage(() => listFacilities({ take: STATUS_FACILITY_COUNT })))
  const activeBookings = billingVisible
    ? settle(() => loadPage(() => listBookings({ status: 'CHECKED_IN', take: 1 })))
    : null
  const recentBookings = billingVisible
    ? settle(() => loadPage(() => listBookings({ take: RECENT_BOOKINGS_COUNT })))
    : null

  const [subscription, tariffPlans] = await Promise.all([subscriptionRequest, tariffRequest])

  const hrefs = Object.fromEntries(
    RANGE_PRESETS.map((p) => [p, buildQuery('/dashboard', { range: p === '30d' ? undefined : p })]),
  ) as Record<RangePreset, string>

  const errorLabel = t('kpiError')
  const iconProps = { size: 19, strokeWidth: 1.8 }
  const cards: Array<{ config: Omit<KpiConfig, 'index'>; result: Promise<Settled<KpiResult>> }> = []

  cards.push({
    config: {
      label: t('stats.facilities.label'),
      hint: t('stats.facilities.hint'),
      icon: <Building2 {...iconProps} />,
      tone: 'blue',
      href: facilitiesHref,
      errorLabel,
    },
    result: settle(async () => ({
      data: { kind: 'number' as const, value: unwrap(await facilities).total },
    })),
  })

  if (tariffPlans) {
    cards.push({
      config: {
        label: t('stats.tariffs.label'),
        hint: t('stats.tariffs.hint'),
        icon: <Tags {...iconProps} />,
        tone: 'violet',
        href: '/dashboard/tariffs',
        errorLabel,
      },
      result: settle(async () => ({
        data: { kind: 'number' as const, value: tariffPlans.active },
        sub: t('stats.tariffs.total', { total: tariffPlans.total }),
      })),
    })
  }

  if (billingVisible && analytics && activeBookings) {
    cards.push(
      {
        config: {
          label: t('stats.activeBookings.label'),
          hint: t('stats.activeBookings.hint'),
          icon: <CalendarCheck {...iconProps} />,
          tone: 'green',
          errorLabel,
        },
        result: settle(async () => ({
          data: { kind: 'number' as const, value: unwrap(await activeBookings).total ?? 0 },
        })),
      },
      {
        config: {
          label: t('stats.revenue.label'),
          hint: t('stats.revenue.hint'),
          icon: <Wallet {...iconProps} />,
          tone: 'amber',
          errorLabel,
        },
        result: settle(async () => {
          const result = unwrap(await analytics)
          return result.kind === 'ok'
            ? {
                data: {
                  kind: 'currency' as const,
                  cents: result.summary.netRevenueCents,
                  currency: result.summary.currency,
                },
              }
            : {}
        }),
      },
      {
        config: {
          label: t('stats.avgOccupancy.label'),
          hint: t('stats.avgOccupancy.hint'),
          icon: <Gauge {...iconProps} />,
          tone: 'cyan',
          showBar: true,
          errorLabel,
        },
        result: settle(async () => {
          const result = unwrap(await analytics)
          return result.kind === 'ok'
            ? { data: { kind: 'percent' as const, ratio: result.summary.occupancy.ratio } }
            : {}
        }),
      },
    )
    if (subscription) {
      cards.push({
        config: {
          label: tBilling('teaser.label'),
          hint: tBilling('teaser.hint'),
          icon: <Gem {...iconProps} />,
          tone: 'violet',
          href: '/dashboard/billing',
          errorLabel,
        },
        result: settle(async () => ({
          data: {
            kind: 'text' as const,
            text: subscription.planName ?? tBilling('current.noPlan'),
          },
          sub: tBilling('teaser.usage', {
            current: subscription.usage.facilities,
            limit:
              subscription.entitlements.maxFacilities === null
                ? tBilling('usage.unlimitedShort')
                : String(subscription.entitlements.maxFacilities),
          }),
        })),
      })
    }
  }

  return (
    <div className="ov">
      <header className="ov-phead">
        <div>
          <h1>{t('title')}</h1>
          <p>{t('description')}</p>
        </div>
        <PeriodControl active={preset} hrefs={hrefs} showPeriods={billingVisible} />
      </header>

      <section className="ov-kpis" aria-label={t('kpiRegion')} data-count={cards.length}>
        {cards.map((card, index) => (
          <KpiSection
            key={card.config.label}
            config={{ ...card.config, index }}
            result={card.result}
          />
        ))}
      </section>

      {billingVisible && analytics && recentBookings ? (
        <>
          <div className="ov-row2">
            <RevenueSection analytics={analytics} />
            <OccupancySection analytics={analytics} />
          </div>
          <BookingsSection
            bookings={recentBookings}
            basePath={bookingsHref}
            viewAll={
              <Link href={bookingsHref} className="ov-link">
                {t('recentBookings.viewAll')}
                <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            }
          />
        </>
      ) : null}
    </div>
  )
}
