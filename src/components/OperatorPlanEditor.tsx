'use client'

import { useActionState, useMemo, useReducer, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { SUBSCRIPTION_FEATURES } from '@spark/types'
import { saveOperatorPlanAction } from '@/lib/operator-plan-actions'
import {
  BILLING_INTERVALS,
  FEATURE_LABEL_KEY,
  QUOTA_KEYS,
  amountInputToCents,
  bpsToPercentInput,
  centsToAmountInput,
  operatorPlanDraftSchema,
  percentInputToBps,
} from '@/lib/operator-plan-schema'
import { FieldInfo } from './FieldInfo'
import type { QuotaKey } from '@/lib/operator-plan-schema'
import type { OperatorPlanActionResult } from '@/lib/operator-plan-actions'
import type { OperatorPlanDraft } from '@/lib/operator-plan-api'
import type { BillingInterval, Entitlements, SubscriptionFeature } from '@spark/types'

interface Props {
  mode: 'create' | 'edit'
  planId?: string
  plan: OperatorPlanDraft
}

const INITIAL_STATE: OperatorPlanActionResult = { ok: true }

type Action =
  | { type: 'meta'; patch: Partial<OperatorPlanDraft> }
  | { type: 'entitlements'; patch: Partial<Entitlements> }
  | { type: 'quota'; key: QuotaKey; value: number | null }
  | { type: 'feature'; feature: SubscriptionFeature; enabled: boolean }

function reducer(draft: OperatorPlanDraft, action: Action): OperatorPlanDraft {
  switch (action.type) {
    case 'meta':
      return { ...draft, ...action.patch }
    case 'entitlements':
      return { ...draft, entitlements: { ...draft.entitlements, ...action.patch } }
    case 'quota': {
      const entitlements: Entitlements = { ...draft.entitlements }
      entitlements[action.key] = action.value
      return { ...draft, entitlements }
    }
    case 'feature': {
      const features = action.enabled
        ? [...new Set([...draft.entitlements.features, action.feature])]
        : draft.entitlements.features.filter((feature) => feature !== action.feature)
      return { ...draft, entitlements: { ...draft.entitlements, features } }
    }
    default:
      return draft
  }
}

function parseLimit(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value)
}

function limitInputValue(value: number | null): string {
  if (value === null || Number.isNaN(value)) return ''
  return String(value)
}

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus()
  const t = useTranslations('operatorPlans')
  return (
    <button type="submit" className="btn btn--primary" disabled={pending}>
      {pending
        ? t('editor.saving')
        : mode === 'create'
          ? t('editor.createPlan')
          : t('editor.saveChanges')}
    </button>
  )
}

export function OperatorPlanEditor({ mode, planId, plan }: Props) {
  const t = useTranslations('operatorPlans')
  const [draft, dispatch] = useReducer(reducer, plan)

  const boundSave = useMemo(() => saveOperatorPlanAction.bind(null, planId ?? null), [planId])
  const [state, formAction] = useActionState(boundSave, INITIAL_STATE)

  const [priceInput, setPriceInput] = useState(() => centsToAmountInput(plan.priceCents))
  const [commissionInput, setCommissionInput] = useState(() =>
    bpsToPercentInput(plan.entitlements.commissionBps),
  )
  // Restores the number an admin had typed when they toggle "Unlimited" off again, so the
  // checkbox is a reversible view of the same field rather than a destructive one.
  const lastLimits = useRef<Record<QuotaKey, number>>({
    maxFacilities: plan.entitlements.maxFacilities ?? 0,
    maxTariffPlans: plan.entitlements.maxTariffPlans ?? 0,
    maxStaffSeats: plan.entitlements.maxStaffSeats ?? 0,
  })

  const clientValidation = useMemo(() => {
    const parsed = operatorPlanDraftSchema.safeParse(draft)
    return parsed.success
      ? { ok: true as const, issues: [] as string[] }
      : { ok: false as const, issues: parsed.error.issues.map((issue) => t(issue.message)) }
  }, [draft, t])

  const draftKey = JSON.stringify(draft)

  function setQuota(key: QuotaKey, value: number | null) {
    if (value !== null && Number.isFinite(value)) {
      lastLimits.current[key] = value
    }
    dispatch({ type: 'quota', key, value })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!clientValidation.ok) {
      e.preventDefault()
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="facility-form-card">
      <input type="hidden" name="draft" value={draftKey} />

      {!state.ok ? (
        <p className="form-banner form-banner--error" role="alert">
          <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
          {state.detail ?? t(state.errorKey)}
        </p>
      ) : null}

      {!clientValidation.ok ? (
        <div className="form-banner form-banner--warning" role="status">
          <AlertTriangle size={18} strokeWidth={2} aria-hidden="true" />
          <div className="form-banner__body">
            <strong>{t('editor.fixBeforeSaving')}</strong>
            <ul>
              {Array.from(new Set(clientValidation.issues)).map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <section className="editor-section card">
        <div className="editor-section__head">
          <h3 className="h-heading">{t('meta.heading')}</h3>
        </div>

        <div className="field-grid">
          <label className="field">
            <span className="field__label">
              {t('meta.code')}
              <FieldInfo text={t('meta.info.code')} />
            </span>
            <input
              className="input"
              type="text"
              value={draft.code}
              disabled={mode === 'edit'}
              onChange={(e) =>
                dispatch({ type: 'meta', patch: { code: e.target.value.toLowerCase() } })
              }
            />
            {mode === 'edit' ? (
              <span className="text-secondary editor-section__hint">{t('meta.codeImmutable')}</span>
            ) : null}
          </label>
          <label className="field">
            <span className="field__label">
              {t('meta.name')}
              <FieldInfo text={t('meta.info.name')} />
            </span>
            <input
              className="input"
              type="text"
              value={draft.name}
              onChange={(e) => dispatch({ type: 'meta', patch: { name: e.target.value } })}
            />
          </label>
        </div>

        <label className="field">
          <span className="field__label">
            {t('meta.description')}
            <FieldInfo text={t('meta.info.description')} />
          </span>
          <textarea
            className="input input--textarea"
            rows={3}
            value={draft.description}
            onChange={(e) => dispatch({ type: 'meta', patch: { description: e.target.value } })}
          />
        </label>

        <div className="field-grid">
          <label className="field">
            <span className="field__label">
              {t('meta.price')}
              <FieldInfo text={t('meta.info.price')} />
            </span>
            <input
              className="input"
              type="number"
              min={0}
              step={0.01}
              value={priceInput}
              onChange={(e) => {
                setPriceInput(e.target.value)
                dispatch({
                  type: 'meta',
                  patch: { priceCents: amountInputToCents(e.target.value) },
                })
              }}
            />
          </label>
          <label className="field">
            <span className="field__label">
              {t('meta.currency')}
              <FieldInfo text={t('meta.info.currency')} />
            </span>
            <input
              className="input"
              type="text"
              maxLength={3}
              value={draft.currency}
              onChange={(e) =>
                dispatch({ type: 'meta', patch: { currency: e.target.value.toUpperCase() } })
              }
            />
          </label>
        </div>

        <label className="field">
          <span className="field__label">
            {t('meta.interval')}
            <FieldInfo text={t('meta.info.interval')} />
          </span>
          <select
            className="input"
            value={draft.interval}
            onChange={(e) =>
              dispatch({ type: 'meta', patch: { interval: e.target.value as BillingInterval } })
            }
          >
            {BILLING_INTERVALS.map((interval) => (
              <option key={interval} value={interval}>
                {t(`meta.intervalOptions.${interval === 'MONTHLY' ? 'monthly' : 'yearly'}`)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="editor-section card">
        <div className="editor-section__head">
          <h3 className="h-heading">{t('entitlements.heading')}</h3>
        </div>
        <p className="text-secondary editor-section__hint">{t('entitlements.hint')}</p>

        {QUOTA_KEYS.map((key) => {
          const value = draft.entitlements[key]
          const unlimited = value === null
          return (
            <div className="field" key={key}>
              <span className="field__label">
                {t(`entitlements.${key}`)}
                <FieldInfo text={t(`entitlements.info.${key}`)} />
              </span>
              <div className="field-grid">
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  value={limitInputValue(value)}
                  disabled={unlimited}
                  onChange={(e) => setQuota(key, parseLimit(e.target.value))}
                />
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={unlimited}
                    onChange={(e) =>
                      setQuota(key, e.target.checked ? null : lastLimits.current[key])
                    }
                  />
                  {t('entitlements.unlimited')}
                </label>
              </div>
            </div>
          )
        })}

        <label className="field">
          <span className="field__label">
            {t('entitlements.commission')}
            <FieldInfo text={t('entitlements.info.commissionBps')} />
          </span>
          <input
            className="input"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={commissionInput}
            onChange={(e) => {
              setCommissionInput(e.target.value)
              dispatch({
                type: 'entitlements',
                patch: { commissionBps: percentInputToBps(e.target.value) },
              })
            }}
          />
        </label>

        <div className="field checkbox-group">
          <span className="field__label">
            {t('entitlements.featuresLabel')}
            <FieldInfo text={t('entitlements.info.features')} />
          </span>
          {SUBSCRIPTION_FEATURES.map((feature) => (
            <label className="checkbox-label" key={feature}>
              <input
                type="checkbox"
                checked={draft.entitlements.features.includes(feature)}
                onChange={(e) => dispatch({ type: 'feature', feature, enabled: e.target.checked })}
              />
              {t(`entitlements.features.${FEATURE_LABEL_KEY[feature]}`)}
            </label>
          ))}
        </div>
      </section>

      <section className="editor-section card">
        <div className="editor-section__head">
          <h3 className="h-heading">{t('visibility.heading')}</h3>
        </div>

        <div className="field checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={draft.isPublic}
              onChange={(e) => dispatch({ type: 'meta', patch: { isPublic: e.target.checked } })}
            />
            {t('visibility.isPublic')}
            <FieldInfo text={t('visibility.info.isPublic')} />
          </label>
        </div>

        <label className="field">
          <span className="field__label">
            {t('visibility.sortOrder')}
            <FieldInfo text={t('visibility.info.sortOrder')} />
          </span>
          <input
            className="input"
            type="number"
            min={0}
            step={1}
            value={Number.isNaN(draft.sortOrder) ? '' : String(draft.sortOrder)}
            onChange={(e) =>
              dispatch({ type: 'meta', patch: { sortOrder: parseLimit(e.target.value) } })
            }
          />
        </label>
      </section>

      <div className="form-actions">
        <SubmitButton mode={mode} />
      </div>
    </form>
  )
}
