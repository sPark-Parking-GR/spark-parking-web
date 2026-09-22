'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import { SUBSCRIPTION_FEATURES } from '@spark/types'
import { Spinner } from './Spinner'
import { FieldInfo } from './FieldInfo'
import { assignOperatorPlanAction, setOperatorOverrideAction } from '@/lib/operator-plan-actions'
import {
  FEATURE_LABEL_KEY,
  QUOTA_KEYS,
  STATUS_LABEL_KEY,
  SUBSCRIPTION_STATUSES,
  bpsToPercentInput,
  percentInputToBps,
} from '@/lib/operator-plan-schema'
import { formatMoney } from '@/lib/booking-format'
import type { QuotaKey } from '@/lib/operator-plan-schema'
import type { OperatorPlanView, OperatorSubscriptionView } from '@/lib/operator-plan-api'
import type {
  EntitlementOverride,
  EntitlementSource,
  OperatorUsage,
  SubscriptionFeature,
  SubscriptionStatus,
} from '@spark/types'

interface Props {
  operatorId: string
  subscription: OperatorSubscriptionView
  plans: OperatorPlanView[]
}

const SOURCE_LABEL_KEY: Record<EntitlementSource, string> = {
  exempt: 'exempt',
  subscription: 'subscription',
  'subscription+override': 'subscriptionOverride',
  default: 'default',
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

interface QuotaOverrideState {
  enabled: boolean
  value: number | null
}

interface OverrideState {
  quotas: Record<QuotaKey, QuotaOverrideState>
  commissionEnabled: boolean
  commissionBps: number
  featuresEnabled: boolean
  features: SubscriptionFeature[]
}

function buildOverrideState(override: EntitlementOverride | null): OverrideState {
  const quotaState = (key: QuotaKey): QuotaOverrideState => {
    const value = override?.[key]
    return value === undefined ? { enabled: false, value: 0 } : { enabled: true, value }
  }
  return {
    quotas: {
      maxFacilities: quotaState('maxFacilities'),
      maxTariffPlans: quotaState('maxTariffPlans'),
      maxStaffSeats: quotaState('maxStaffSeats'),
    },
    commissionEnabled: override?.commissionBps !== undefined,
    commissionBps: override?.commissionBps ?? 0,
    featuresEnabled: override?.features !== undefined,
    features: override?.features ?? [],
  }
}

// An override that names no key at all is not an empty deal, it is the absence of one — so
// clearing every checkbox sends null and removes the deviation rather than storing `{}`.
function toEntitlementOverride(state: OverrideState): EntitlementOverride | null {
  const override: EntitlementOverride = {}
  let named = false

  for (const key of QUOTA_KEYS) {
    const quota = state.quotas[key]
    if (quota.enabled) {
      override[key] = quota.value
      named = true
    }
  }
  if (state.commissionEnabled) {
    override.commissionBps = state.commissionBps
    named = true
  }
  if (state.featuresEnabled) {
    override.features = state.features
    named = true
  }

  return named ? override : null
}

function parseLimit(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value)
}

function limitInputValue(value: number | null): string {
  if (value === null || Number.isNaN(value)) return ''
  return String(value)
}

export function OperatorSubscriptionPanel({ operatorId, subscription, plans }: Props) {
  const t = useTranslations('operatorPlans')
  const router = useRouter()

  const [planId, setPlanId] = useState(() => subscription.planId ?? '')
  const [status, setStatus] = useState<SubscriptionStatus>(() => subscription.status ?? 'ACTIVE')
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignDone, setAssignDone] = useState(false)
  const [assigning, startAssign] = useTransition()

  const [override, setOverride] = useState<OverrideState>(() =>
    buildOverrideState(subscription.entitlementOverride),
  )
  const [commissionInput, setCommissionInput] = useState(() =>
    bpsToPercentInput(subscription.entitlementOverride?.commissionBps ?? 0),
  )
  const [overrideError, setOverrideError] = useState<string | null>(null)
  const [overrideDone, setOverrideDone] = useState(false)
  const [savingOverride, startOverride] = useTransition()

  const setQuota = (key: QuotaKey, patch: Partial<QuotaOverrideState>) => {
    setOverride((prev) => ({
      ...prev,
      quotas: { ...prev.quotas, [key]: { ...prev.quotas[key], ...patch } },
    }))
  }

  const submitAssign = () => {
    setAssignError(null)
    setAssignDone(false)
    startAssign(async () => {
      const result = await assignOperatorPlanAction(operatorId, planId, status)
      if (!result.ok) {
        setAssignError(result.detail ?? t(result.errorKey))
        return
      }
      setAssignDone(true)
      router.refresh()
    })
  }

  const submitOverride = () => {
    setOverrideError(null)
    setOverrideDone(false)
    startOverride(async () => {
      const result = await setOperatorOverrideAction(operatorId, toEntitlementOverride(override))
      if (!result.ok) {
        setOverrideError(result.detail ?? t(result.errorKey))
        return
      }
      setOverrideDone(true)
      router.refresh()
    })
  }

  const selectablePlans = plans.filter(
    (plan) => plan.lifecycleStatus === 'ACTIVE' || plan.id === subscription.planId,
  )

  return (
    <div className="panel-card panel-card--wide">
      <div className="panel-card__header">
        <h3 className="panel-card__title">{t('subscription.heading')}</h3>
      </div>
      <div className="panel-card__body panel-card__body--stack">
        <div className="operator-detail-grid">
          <div className="operator-detail-grid__item">
            <span className="operator-detail-grid__label">{t('subscription.currentPlan')}</span>
            <span className="operator-detail-grid__value">
              {subscription.planName ?? t('subscription.noPlan')}
            </span>
          </div>
          <div className="operator-detail-grid__item">
            <span className="operator-detail-grid__label">{t('subscription.status')}</span>
            <span className="operator-detail-grid__value">
              {subscription.status ? (
                <Badge variant={STATUS_VARIANT[subscription.status]}>
                  {t(`subscription.statusOptions.${STATUS_LABEL_KEY[subscription.status]}`)}
                </Badge>
              ) : (
                <Badge variant="neutral">{t('subscription.noStatus')}</Badge>
              )}
            </span>
          </div>
          <div className="operator-detail-grid__item">
            <span className="operator-detail-grid__label">
              {t('subscription.source')}
              <FieldInfo text={t('subscription.info.source')} />
            </span>
            <span className="operator-detail-grid__value">
              {t(`subscription.sources.${SOURCE_LABEL_KEY[subscription.source]}`)}
            </span>
          </div>
          <div className="operator-detail-grid__item">
            <span className="operator-detail-grid__label">{t('subscription.commission')}</span>
            <span className="operator-detail-grid__value">
              {t('subscription.commissionValue', {
                percent: bpsToPercentInput(subscription.entitlements.commissionBps),
              })}
            </span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t('subscription.usageHeading')}</th>
                <th>{t('subscription.usageColumn')}</th>
              </tr>
            </thead>
            <tbody>
              {USAGE_ROWS.map((row) => {
                const limit = subscription.entitlements[row.quota]
                return (
                  <tr key={row.quota}>
                    <td>{t(`entitlements.${row.quota}`)}</td>
                    <td>
                      {t('subscription.usageValue', {
                        current: subscription.usage[row.usage],
                        limit: limit === null ? t('entitlements.unlimitedShort') : String(limit),
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <section className="editor-section card">
          <div className="editor-section__head">
            <h3 className="h-heading">{t('subscription.assign.heading')}</h3>
          </div>
          <p className="text-secondary editor-section__hint">
            {t('subscription.assign.description')}
          </p>

          {assignError ? (
            <p className="form-banner form-banner--error" role="alert">
              <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
              {assignError}
            </p>
          ) : null}
          {assignDone && !assigning ? (
            <p className="form-banner form-banner--success" role="status">
              <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
              {t('subscription.assign.saved')}
            </p>
          ) : null}

          <div className="field-grid">
            <label className="field">
              <span className="field__label">{t('subscription.assign.planLabel')}</span>
              <select
                className="input"
                value={planId}
                disabled={assigning}
                onChange={(e) => setPlanId(e.target.value)}
              >
                <option value="">{t('subscription.assign.choosePlan')}</option>
                {selectablePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} — {formatMoney(plan.priceCents, plan.currency)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">{t('subscription.assign.statusLabel')}</span>
              <select
                className="input"
                value={status}
                disabled={assigning}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
              >
                {SUBSCRIPTION_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {t(`subscription.statusOptions.${STATUS_LABEL_KEY[value]}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={assigning || planId === ''}
              onClick={submitAssign}
            >
              {assigning ? (
                <>
                  <Spinner size={15} />
                  {t('subscription.assign.saving')}
                </>
              ) : (
                t('subscription.assign.submit')
              )}
            </button>
          </div>
        </section>

        <section className="editor-section card">
          <div className="editor-section__head">
            <h3 className="h-heading">{t('subscription.override.heading')}</h3>
          </div>
          <p className="text-secondary editor-section__hint">
            {t('subscription.override.description')}
          </p>

          {overrideError ? (
            <p className="form-banner form-banner--error" role="alert">
              <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
              {overrideError}
            </p>
          ) : null}
          {overrideDone && !savingOverride ? (
            <p className="form-banner form-banner--success" role="status">
              <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
              {t('subscription.override.saved')}
            </p>
          ) : null}

          {QUOTA_KEYS.map((key) => {
            const quota = override.quotas[key]
            const unlimited = quota.value === null
            return (
              <div className="field" key={key}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={quota.enabled}
                    disabled={savingOverride}
                    onChange={(e) => setQuota(key, { enabled: e.target.checked })}
                  />
                  {t(`entitlements.${key}`)}
                </label>
                {quota.enabled ? (
                  <div className="field-grid">
                    <input
                      className="input"
                      type="number"
                      min={0}
                      step={1}
                      value={limitInputValue(quota.value)}
                      disabled={unlimited || savingOverride}
                      onChange={(e) => setQuota(key, { value: parseLimit(e.target.value) })}
                    />
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={unlimited}
                        disabled={savingOverride}
                        onChange={(e) => setQuota(key, { value: e.target.checked ? null : 0 })}
                      />
                      {t('entitlements.unlimited')}
                    </label>
                  </div>
                ) : null}
              </div>
            )
          })}

          <div className="field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={override.commissionEnabled}
                disabled={savingOverride}
                onChange={(e) =>
                  setOverride((prev) => ({ ...prev, commissionEnabled: e.target.checked }))
                }
              />
              {t('entitlements.commission')}
            </label>
            {override.commissionEnabled ? (
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={commissionInput}
                disabled={savingOverride}
                onChange={(e) => {
                  setCommissionInput(e.target.value)
                  setOverride((prev) => ({
                    ...prev,
                    commissionBps: percentInputToBps(e.target.value),
                  }))
                }}
              />
            ) : null}
          </div>

          <div className="field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={override.featuresEnabled}
                disabled={savingOverride}
                onChange={(e) =>
                  setOverride((prev) => ({ ...prev, featuresEnabled: e.target.checked }))
                }
              />
              {t('entitlements.featuresLabel')}
            </label>
            {override.featuresEnabled ? (
              <div className="checkbox-group">
                {SUBSCRIPTION_FEATURES.map((feature) => (
                  <label className="checkbox-label" key={feature}>
                    <input
                      type="checkbox"
                      checked={override.features.includes(feature)}
                      disabled={savingOverride}
                      onChange={(e) =>
                        setOverride((prev) => ({
                          ...prev,
                          features: e.target.checked
                            ? [...new Set([...prev.features, feature])]
                            : prev.features.filter((item) => item !== feature),
                        }))
                      }
                    />
                    {t(`entitlements.features.${FEATURE_LABEL_KEY[feature]}`)}
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={savingOverride}
              onClick={submitOverride}
            >
              {savingOverride ? (
                <>
                  <Spinner size={15} />
                  {t('subscription.override.saving')}
                </>
              ) : (
                t('subscription.override.submit')
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
