import { getTranslations } from 'next-intl/server'
import { AlertTriangle, Info } from 'lucide-react'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import { FEATURE_LABEL_KEY, STATUS_LABEL_KEY, bpsToPercentInput } from '@/lib/operator-plan-schema'
import { formatDateDisplay } from '@/lib/datetime'
import type { QuotaKey } from '@/lib/operator-plan-schema'
import type { MyOperatorSubscription } from '@/lib/operator-subscription-api'
import type { OperatorUsage, SubscriptionStatus } from '@spark/types'

interface Props {
  subscription: MyOperatorSubscription
}

const USAGE_ROWS: { quota: QuotaKey; usage: keyof OperatorUsage }[] = [
  { quota: 'maxFacilities', usage: 'facilities' },
  { quota: 'maxTariffPlans', usage: 'tariffPlans' },
  { quota: 'maxStaffSeats', usage: 'staffSeats' },
]

const STATUS_VARIANT: Record<SubscriptionStatus, BadgeVariant> = {
  TRIALING: 'warn',
  ACTIVE: 'ok',
  PAST_DUE: 'bad',
  CANCELLED: 'neutral',
}

// The wire value is an instant, but a billing period is a calendar range — taking the date
// half keeps it off the day boundary that a local-time reparse of the instant would cross.
function periodDate(iso: string): string {
  return formatDateDisplay(iso.slice(0, 10))
}

type UsagePressure = 'ok' | 'near' | 'full'

/**
 * The same 80%/100% boundaries the API nudges on, and computed the same way — integer
 * comparison, `null` is unlimited, and a limit of 0 is only "full" once something is
 * actually held. A page that drew the warning at a different line from the one the email is
 * sent at would make the two contradict each other.
 */
function pressureOf(current: number, limit: number | null): UsagePressure {
  if (limit === null) return 'ok'
  if (limit === 0) return current > 0 ? 'full' : 'ok'
  if (current >= limit) return 'full'
  return current * 100 >= limit * 80 ? 'near' : 'ok'
}

export async function BillingPlanPanel({ subscription }: Props) {
  const t = await getTranslations('billing')

  const usageRows = USAGE_ROWS.map((row) => {
    const limit = subscription.entitlements[row.quota]
    const current = subscription.usage[row.usage]
    return { ...row, limit, current, pressure: pressureOf(current, limit) }
  })
  const pressured = usageRows.filter((row) => row.pressure !== 'ok')

  const { currentPeriodStart: start, currentPeriodEnd: end } = subscription
  const period =
    start && end
      ? t('current.periodValue', { start: periodDate(start), end: periodDate(end) })
      : t('current.noPeriod')

  return (
    <div className="panel-card panel-card--wide">
      <div className="panel-card__header">
        <div>
          <h2 className="panel-card__title">{t('current.heading')}</h2>
          <p className="panel-card__subtitle text-secondary">{t('current.subtitle')}</p>
        </div>
      </div>
      <div className="panel-card__body panel-card__body--stack">
        {subscription.source === 'exempt' ? (
          <p className="form-banner form-banner--info" role="note">
            <Info size={18} strokeWidth={2} aria-hidden="true" />
            {t('current.exempt')}
          </p>
        ) : null}

        <div className="operator-detail-grid">
          <div className="operator-detail-grid__item">
            <span className="operator-detail-grid__label">{t('current.plan')}</span>
            <span className="operator-detail-grid__value">
              {subscription.planName ?? t('current.noPlan')}
            </span>
          </div>
          <div className="operator-detail-grid__item">
            <span className="operator-detail-grid__label">{t('current.status')}</span>
            <span className="operator-detail-grid__value">
              {subscription.status ? (
                <Badge variant={STATUS_VARIANT[subscription.status]}>
                  {t(`current.statusOptions.${STATUS_LABEL_KEY[subscription.status]}`)}
                </Badge>
              ) : (
                <Badge variant="neutral">{t('current.noStatus')}</Badge>
              )}
            </span>
          </div>
          <div className="operator-detail-grid__item">
            <span className="operator-detail-grid__label">{t('current.period')}</span>
            <span className="operator-detail-grid__value">{period}</span>
          </div>
          <div className="operator-detail-grid__item">
            <span className="operator-detail-grid__label">{t('current.commission')}</span>
            <span className="operator-detail-grid__value">
              {t('current.commissionValue', {
                percent: bpsToPercentInput(subscription.entitlements.commissionBps),
              })}
            </span>
          </div>
        </div>

        {subscription.trialEndsAt ? (
          <p className="text-secondary">
            {t('current.trialEnds', { date: periodDate(subscription.trialEndsAt) })}
          </p>
        ) : null}
        {subscription.cancelAtPeriodEnd && end ? (
          <p className="form-banner form-banner--warning" role="note">
            {t('current.cancelling', { date: periodDate(end) })}
          </p>
        ) : null}

        {pressured.length > 0 ? (
          <p className="form-banner form-banner--warning" role="note">
            <AlertTriangle size={18} strokeWidth={2} aria-hidden="true" />
            {t(
              pressured.some((row) => row.pressure === 'full')
                ? 'usage.atLimit'
                : 'usage.nearLimit',
              {
                resources: pressured.map((row) => t(`usage.${row.quota}`)).join(', '),
              },
            )}
          </p>
        ) : null}

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t('usage.resource')}</th>
                <th>{t('usage.column')}</th>
              </tr>
            </thead>
            <tbody>
              {usageRows.map((row) => (
                <tr key={row.quota}>
                  <td>{t(`usage.${row.quota}`)}</td>
                  <td>
                    {t('usage.value', {
                      current: row.current,
                      limit: row.limit === null ? t('usage.unlimitedShort') : String(row.limit),
                    })}
                    {row.pressure === 'ok' ? null : (
                      <Badge variant={row.pressure === 'full' ? 'bad' : 'warn'}>
                        {t(row.pressure === 'full' ? 'usage.atLimitBadge' : 'usage.nearLimitBadge')}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="h-heading">{t('features.heading')}</h3>
          {subscription.entitlements.features.length === 0 ? (
            <p className="text-secondary">{t('features.none')}</p>
          ) : (
            <span className="badge-stack">
              {subscription.entitlements.features.map((feature) => (
                <Badge key={feature} variant="ok">
                  {t(`features.names.${FEATURE_LABEL_KEY[feature]}`)}
                </Badge>
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
