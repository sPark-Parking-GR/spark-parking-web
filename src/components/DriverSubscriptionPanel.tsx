'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Badge, Switch } from '@spark/ui'
import { Spinner } from './Spinner'
import {
  assignDriverSubscriptionAction,
  setDriverEntitlementOverrideAction,
} from '@/lib/driver-plan-actions'
import {
  DRIVER_SUBSCRIPTION_FEATURES,
  DRIVER_SUBSCRIPTION_STATUSES,
  ENTITLEMENT_KEYS,
  bpsToPercent,
  percentToBps,
} from '@/lib/driver-plan-types'
import { formatMoney } from '@/lib/booking-format'
import type { BadgeVariant } from '@spark/ui'
import type {
  DriverEntitlementOverride,
  DriverEntitlements,
  DriverSubscriptionDetail,
  DriverSubscriptionFeature,
  DriverSubscriptionStatus,
} from '@/lib/driver-plan-types'

export interface DriverPlanOption {
  id: string
  code: string
  name: string
  priceCents: number
  currency: string
}

interface Props {
  userId: string
  subscription: DriverSubscriptionDetail
  plans: DriverPlanOption[]
}

type OverrideKey = keyof DriverEntitlements

const STATUS_VARIANT: Record<DriverSubscriptionStatus, BadgeVariant> = {
  TRIALING: 'warn',
  ACTIVE: 'ok',
  PAST_DUE: 'bad',
  CANCELLED: 'neutral',
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function seedValues(subscription: DriverSubscriptionDetail): DriverEntitlements {
  const override = subscription.entitlementOverride
  return {
    bookingDiscountBps:
      override?.bookingDiscountBps !== undefined
        ? override.bookingDiscountBps
        : subscription.entitlements.bookingDiscountBps,
    bookingFeeWaived: override?.bookingFeeWaived ?? subscription.entitlements.bookingFeeWaived,
    freeCancellations:
      override?.freeCancellations !== undefined
        ? override.freeCancellations
        : subscription.entitlements.freeCancellations,
    features: override?.features ?? subscription.entitlements.features,
  }
}

function seedEnabled(subscription: DriverSubscriptionDetail): Record<OverrideKey, boolean> {
  const override = subscription.entitlementOverride
  return {
    bookingDiscountBps: override?.bookingDiscountBps !== undefined,
    bookingFeeWaived: override?.bookingFeeWaived !== undefined,
    freeCancellations: override?.freeCancellations !== undefined,
    features: override?.features !== undefined,
  }
}

export function DriverSubscriptionPanel({ userId, subscription, plans }: Props) {
  const t = useTranslations('driverPlans')
  const router = useRouter()

  const [planId, setPlanId] = useState(subscription.planId ?? plans[0]?.id ?? '')
  const [status, setStatus] = useState<DriverSubscriptionStatus>(subscription.status ?? 'ACTIVE')
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignPending, startAssign] = useTransition()

  const [enabled, setEnabled] = useState(() => seedEnabled(subscription))
  const [values, setValues] = useState(() => seedValues(subscription))
  const [overrideError, setOverrideError] = useState<string | null>(null)
  const [overridePending, startOverride] = useTransition()

  const hasSubscription = subscription.subscriptionId !== null
  const noDiscount = values.bookingDiscountBps === null
  const unlimitedCancellations = values.freeCancellations === null

  const patchValues = (patch: Partial<DriverEntitlements>) =>
    setValues((prev) => ({ ...prev, ...patch }))

  const toggleFeature = (feature: DriverSubscriptionFeature, checked: boolean) =>
    patchValues({
      features: checked
        ? [...values.features, feature]
        : values.features.filter((f) => f !== feature),
    })

  const submitAssign = () => {
    setAssignError(null)
    startAssign(async () => {
      const result = await assignDriverSubscriptionAction(userId, planId, status)
      if (!result.ok) {
        setAssignError(result.detail ?? t(result.errorKey))
        return
      }
      router.refresh()
    })
  }

  const submitOverride = (clear: boolean) => {
    setOverrideError(null)
    const payload: DriverEntitlementOverride | null = clear
      ? null
      : ENTITLEMENT_KEYS.reduce<DriverEntitlementOverride>((acc, key) => {
          if (!enabled[key]) return acc
          switch (key) {
            case 'bookingDiscountBps':
              return { ...acc, bookingDiscountBps: values.bookingDiscountBps }
            case 'bookingFeeWaived':
              return { ...acc, bookingFeeWaived: values.bookingFeeWaived }
            case 'freeCancellations':
              return { ...acc, freeCancellations: values.freeCancellations }
            case 'features':
              return { ...acc, features: values.features }
          }
        }, {})

    startOverride(async () => {
      const result = await setDriverEntitlementOverrideAction(
        userId,
        payload !== null && Object.keys(payload).length === 0 ? null : payload,
      )
      if (!result.ok) {
        setOverrideError(result.detail ?? t(result.errorKey))
        return
      }
      if (clear) {
        setEnabled({
          bookingDiscountBps: false,
          bookingFeeWaived: false,
          freeCancellations: false,
          features: false,
        })
      }
      router.refresh()
    })
  }

  const effective = subscription.entitlements

  return (
    <div className="panel-card panel-card--wide">
      <div className="panel-card__header">
        <h3 className="panel-card__title">{t('subscription.title')}</h3>
      </div>
      <div className="panel-card__body panel-card__body--stack driver-subscription-panel">
        {hasSubscription ? (
          <div className="operator-detail-grid">
            <div className="operator-detail-grid__item">
              <span className="operator-detail-grid__label">{t('subscription.fields.plan')}</span>
              <span className="operator-detail-grid__value">
                {subscription.planName ?? subscription.planCode ?? '—'}
              </span>
            </div>
            <div className="operator-detail-grid__item">
              <span className="operator-detail-grid__label">{t('subscription.fields.status')}</span>
              <span className="operator-detail-grid__value">
                {subscription.status ? (
                  <Badge variant={STATUS_VARIANT[subscription.status]}>
                    {t(`status.${subscription.status}`)}
                  </Badge>
                ) : (
                  '—'
                )}
              </span>
            </div>
            <div className="operator-detail-grid__item">
              <span className="operator-detail-grid__label">{t('subscription.fields.period')}</span>
              <span className="operator-detail-grid__value">
                {subscription.currentPeriodStart
                  ? dateFmt.format(new Date(subscription.currentPeriodStart))
                  : '—'}
                {' – '}
                {subscription.currentPeriodEnd
                  ? dateFmt.format(new Date(subscription.currentPeriodEnd))
                  : t('subscription.openEnded')}
              </span>
            </div>
            <div className="operator-detail-grid__item">
              <span className="operator-detail-grid__label">
                {t('subscription.fields.trialEndsAt')}
              </span>
              <span className="operator-detail-grid__value">
                {subscription.trialEndsAt
                  ? dateFmt.format(new Date(subscription.trialEndsAt))
                  : t('subscription.none')}
              </span>
            </div>
            <div className="operator-detail-grid__item">
              <span className="operator-detail-grid__label">
                {t('subscription.fields.cancelAtPeriodEnd')}
              </span>
              <span className="operator-detail-grid__value">
                {subscription.cancelAtPeriodEnd ? t('subscription.yes') : t('subscription.no')}
              </span>
            </div>
            <div className="operator-detail-grid__item">
              <span className="operator-detail-grid__label">
                {t('subscription.fields.provider')}
              </span>
              <span className="operator-detail-grid__value mono">
                {subscription.providerSubscriptionId ?? t('subscription.none')}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-secondary">{t('subscription.freeTier')}</p>
        )}

        <div className="operator-detail-grid">
          <div className="operator-detail-grid__item">
            <span className="operator-detail-grid__label">
              {t('entitlements.bookingDiscount')}
            </span>
            <span className="operator-detail-grid__value">
              {effective.bookingDiscountBps === null
                ? t('entitlements.noDiscount')
                : `${bpsToPercent(effective.bookingDiscountBps)}%`}
            </span>
          </div>
          <div className="operator-detail-grid__item">
            <span className="operator-detail-grid__label">
              {t('entitlements.bookingFeeWaived')}
            </span>
            <span className="operator-detail-grid__value">
              {effective.bookingFeeWaived ? t('subscription.yes') : t('subscription.no')}
            </span>
          </div>
          <div className="operator-detail-grid__item">
            <span className="operator-detail-grid__label">
              {t('entitlements.freeCancellations')}
            </span>
            <span className="operator-detail-grid__value">
              {effective.freeCancellations === null
                ? t('entitlements.unlimited')
                : effective.freeCancellations}
            </span>
          </div>
          <div className="operator-detail-grid__item">
            <span className="operator-detail-grid__label">{t('entitlements.features')}</span>
            <span className="operator-detail-grid__value">
              {effective.features.length === 0
                ? t('subscription.none')
                : effective.features
                    .map((feature) => t(`entitlements.featureLabels.${feature}`))
                    .join(', ')}
            </span>
          </div>
          <div className="operator-detail-grid__item">
            <span className="operator-detail-grid__label">{t('subscription.fields.source')}</span>
            <span className="operator-detail-grid__value">
              {t(`subscription.source.${subscription.source}`)}
            </span>
          </div>
        </div>

        <section className="editor-section card">
          <div className="editor-section__head">
            <h3 className="h-heading">{t('subscription.assign.heading')}</h3>
            <p className="text-secondary editor-section__hint">
              {t('subscription.assign.hint')}
            </p>
          </div>

          {plans.length === 0 ? (
            <p className="text-secondary">{t('subscription.assign.noPlans')}</p>
          ) : (
            <>
              <div className="field-grid">
                <label className="field">
                  <span className="field__label">{t('subscription.assign.planLabel')}</span>
                  <select
                    className="input"
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    disabled={assignPending}
                  >
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} · {formatMoney(plan.priceCents, plan.currency)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">{t('subscription.assign.statusLabel')}</span>
                  <select
                    className="input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DriverSubscriptionStatus)}
                    disabled={assignPending}
                  >
                    {DRIVER_SUBSCRIPTION_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {t(`status.${value}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {assignError ? (
                <p className="form-banner form-banner--error" role="alert">
                  {assignError}
                </p>
              ) : null}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={assignPending || !planId}
                  onClick={submitAssign}
                >
                  {assignPending ? (
                    <>
                      <Spinner size={15} />
                      {t('subscription.assign.saving')}
                    </>
                  ) : (
                    t('subscription.assign.submit')
                  )}
                </button>
              </div>
            </>
          )}
        </section>

        <section className="editor-section card">
          <div className="editor-section__head">
            <h3 className="h-heading">{t('subscription.override.heading')}</h3>
            <p className="text-secondary editor-section__hint">
              {t('subscription.override.hint')}
            </p>
          </div>

          {!hasSubscription ? (
            <p className="text-secondary">{t('subscription.override.needsPlan')}</p>
          ) : (
            <>
              <div className="field-grid">
                <div className="field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={enabled.bookingDiscountBps}
                      onChange={(e) =>
                        setEnabled({ ...enabled, bookingDiscountBps: e.target.checked })
                      }
                    />
                    {t('entitlements.bookingDiscount')}
                  </label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    inputMode="decimal"
                    disabled={!enabled.bookingDiscountBps || noDiscount || overridePending}
                    value={noDiscount ? '' : bpsToPercent(values.bookingDiscountBps as number)}
                    onChange={(e) =>
                      patchValues({ bookingDiscountBps: percentToBps(e.target.value) })
                    }
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={noDiscount}
                      disabled={!enabled.bookingDiscountBps || overridePending}
                      onChange={(e) =>
                        patchValues({ bookingDiscountBps: e.target.checked ? null : 0 })
                      }
                    />
                    {t('entitlements.noDiscount')}
                  </label>
                </div>

                <div className="field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={enabled.freeCancellations}
                      onChange={(e) =>
                        setEnabled({ ...enabled, freeCancellations: e.target.checked })
                      }
                    />
                    {t('entitlements.freeCancellations')}
                  </label>
                  <input
                    className="input"
                    type="number"
                    step="1"
                    min="0"
                    disabled={!enabled.freeCancellations || unlimitedCancellations || overridePending}
                    value={unlimitedCancellations ? '' : (values.freeCancellations as number)}
                    onChange={(e) =>
                      patchValues({ freeCancellations: Math.trunc(Number(e.target.value)) || 0 })
                    }
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={unlimitedCancellations}
                      disabled={!enabled.freeCancellations || overridePending}
                      onChange={(e) =>
                        patchValues({ freeCancellations: e.target.checked ? null : 0 })
                      }
                    />
                    {t('entitlements.unlimited')}
                  </label>
                </div>
              </div>

              <div className="field checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={enabled.bookingFeeWaived}
                    onChange={(e) =>
                      setEnabled({ ...enabled, bookingFeeWaived: e.target.checked })
                    }
                  />
                  {t('entitlements.bookingFeeWaived')}
                </label>
                <label className="checkbox-label">
                  <Switch
                    checked={values.bookingFeeWaived}
                    disabled={!enabled.bookingFeeWaived || overridePending}
                    onChange={(bookingFeeWaived) => patchValues({ bookingFeeWaived })}
                  />
                  {values.bookingFeeWaived ? t('subscription.yes') : t('subscription.no')}
                </label>
              </div>

              <div className="field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={enabled.features}
                    onChange={(e) => setEnabled({ ...enabled, features: e.target.checked })}
                  />
                  {t('entitlements.features')}
                </label>
                <div className="checkbox-group">
                  {DRIVER_SUBSCRIPTION_FEATURES.map((feature) => (
                    <label key={feature} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={values.features.includes(feature)}
                        disabled={!enabled.features || overridePending}
                        onChange={(e) => toggleFeature(feature, e.target.checked)}
                      />
                      {t(`entitlements.featureLabels.${feature}`)}
                    </label>
                  ))}
                </div>
              </div>

              {overrideError ? (
                <p className="form-banner form-banner--error" role="alert">
                  {overrideError}
                </p>
              ) : null}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={overridePending || subscription.entitlementOverride === null}
                  onClick={() => submitOverride(true)}
                >
                  {t('subscription.override.clear')}
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={overridePending}
                  onClick={() => submitOverride(false)}
                >
                  {overridePending ? (
                    <>
                      <Spinner size={15} />
                      {t('subscription.override.saving')}
                    </>
                  ) : (
                    t('subscription.override.submit')
                  )}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
