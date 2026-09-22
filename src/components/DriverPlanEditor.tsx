'use client'

import { useActionState, useMemo, useReducer } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { Switch } from '@spark/ui'
import { saveDriverPlanAction } from '@/lib/driver-plan-actions'
import {
  BILLING_INTERVALS,
  DRIVER_SUBSCRIPTION_FEATURES,
  amountToCents,
  bpsToPercent,
  centsToAmount,
  driverPlanDraftSchema,
  percentToBps,
} from '@/lib/driver-plan-types'
import { FieldInfo } from './FieldInfo'
import type { DriverPlanActionResult } from '@/lib/driver-plan-actions'
import type {
  DriverEntitlements,
  DriverPlanDraft,
  DriverSubscriptionFeature,
} from '@/lib/driver-plan-types'

interface Props {
  mode: 'create' | 'edit'
  planId?: string
  plan: DriverPlanDraft
}

const INITIAL_STATE: DriverPlanActionResult = { ok: true }

type Action =
  | { type: 'plan'; patch: Partial<DriverPlanDraft> }
  | { type: 'entitlements'; patch: Partial<DriverEntitlements> }

function reducer(draft: DriverPlanDraft, action: Action): DriverPlanDraft {
  switch (action.type) {
    case 'plan':
      return { ...draft, ...action.patch }
    case 'entitlements':
      return { ...draft, entitlements: { ...draft.entitlements, ...action.patch } }
    default:
      return draft
  }
}

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus()
  const t = useTranslations('driverPlans')
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

export function DriverPlanEditor({ mode, planId, plan }: Props) {
  const t = useTranslations('driverPlans')
  const [draft, dispatch] = useReducer(reducer, plan)

  const boundSave = useMemo(() => saveDriverPlanAction.bind(null, planId ?? null), [planId])
  const [state, formAction] = useActionState(boundSave, INITIAL_STATE)

  const clientValidation = useMemo(() => {
    const parsed = driverPlanDraftSchema.safeParse(draft)
    return parsed.success
      ? { ok: true as const, issues: [] as string[] }
      : { ok: false as const, issues: parsed.error.issues.map((i) => t(i.message)) }
  }, [draft, t])

  const { entitlements } = draft
  const noDiscount = entitlements.bookingDiscountBps === null
  const unlimitedCancellations = entitlements.freeCancellations === null

  function toggleFeature(feature: DriverSubscriptionFeature, checked: boolean) {
    const next = checked
      ? [...entitlements.features, feature]
      : entitlements.features.filter((f) => f !== feature)
    dispatch({ type: 'entitlements', patch: { features: next } })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!clientValidation.ok) {
      e.preventDefault()
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="driver-plan-editor">
      <input type="hidden" name="draft" value={JSON.stringify(draft)} />

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
          {mode === 'create' ? (
            <label className="field">
              <span className="field__label">
                {t('meta.code')}
                <FieldInfo text={t('meta.info.code')} />
              </span>
              <input
                className="input"
                type="text"
                value={draft.code}
                autoComplete="off"
                onChange={(e) => dispatch({ type: 'plan', patch: { code: e.target.value } })}
              />
            </label>
          ) : (
            <div className="field">
              <span className="field__label">
                {t('meta.code')}
                <FieldInfo text={t('meta.info.codeImmutable')} />
              </span>
              <span className="operator-detail-grid__value mono">{draft.code}</span>
            </div>
          )}

          <label className="field">
            <span className="field__label">
              {t('meta.name')}
              <FieldInfo text={t('meta.info.name')} />
            </span>
            <input
              className="input"
              type="text"
              value={draft.name}
              onChange={(e) => dispatch({ type: 'plan', patch: { name: e.target.value } })}
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
            value={draft.description}
            onChange={(e) => dispatch({ type: 'plan', patch: { description: e.target.value } })}
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
              step="0.01"
              min="0"
              inputMode="decimal"
              value={centsToAmount(draft.priceCents)}
              onChange={(e) =>
                dispatch({ type: 'plan', patch: { priceCents: amountToCents(e.target.value) } })
              }
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
              value={draft.currency}
              maxLength={3}
              onChange={(e) =>
                dispatch({ type: 'plan', patch: { currency: e.target.value.toUpperCase() } })
              }
            />
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
            <span className="field__label">
              {t('meta.interval')}
              <FieldInfo text={t('meta.info.interval')} />
            </span>
            <select
              className="input"
              value={draft.interval}
              onChange={(e) =>
                dispatch({
                  type: 'plan',
                  patch: { interval: e.target.value as DriverPlanDraft['interval'] },
                })
              }
            >
              {BILLING_INTERVALS.map((interval) => (
                <option key={interval} value={interval}>
                  {t(`interval.${interval}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">
              {t('meta.sortOrder')}
              <FieldInfo text={t('meta.info.sortOrder')} />
            </span>
            <input
              className="input"
              type="number"
              min="0"
              step="1"
              value={draft.sortOrder}
              onChange={(e) =>
                dispatch({
                  type: 'plan',
                  patch: { sortOrder: Math.trunc(Number(e.target.value)) || 0 },
                })
              }
            />
          </label>
        </div>

        <div className="field checkbox-group">
          <label className="checkbox-label">
            <Switch
              checked={draft.isPublic}
              onChange={(isPublic) => dispatch({ type: 'plan', patch: { isPublic } })}
            />
            {t('meta.isPublic')}
            <FieldInfo text={t('meta.info.isPublic')} />
          </label>
        </div>
      </section>

      <section className="editor-section card">
        <div className="editor-section__head">
          <h3 className="h-heading">{t('entitlements.heading')}</h3>
          <p className="text-secondary editor-section__hint">{t('entitlements.hint')}</p>
        </div>

        <div className="field-grid">
          <div className="field">
            <span className="field__label">
              {t('entitlements.bookingDiscount')}
              <FieldInfo text={t('entitlements.info.bookingDiscount')} />
            </span>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              max="100"
              inputMode="decimal"
              disabled={noDiscount}
              value={noDiscount ? '' : bpsToPercent(entitlements.bookingDiscountBps as number)}
              placeholder={noDiscount ? t('entitlements.noDiscount') : undefined}
              onChange={(e) =>
                dispatch({
                  type: 'entitlements',
                  patch: { bookingDiscountBps: percentToBps(e.target.value) },
                })
              }
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={noDiscount}
                onChange={(e) =>
                  dispatch({
                    type: 'entitlements',
                    patch: { bookingDiscountBps: e.target.checked ? null : 0 },
                  })
                }
              />
              {t('entitlements.noDiscount')}
            </label>
          </div>

          <div className="field">
            <span className="field__label">
              {t('entitlements.freeCancellations')}
              <FieldInfo text={t('entitlements.info.freeCancellations')} />
            </span>
            <input
              className="input"
              type="number"
              step="1"
              min="0"
              disabled={unlimitedCancellations}
              value={unlimitedCancellations ? '' : (entitlements.freeCancellations as number)}
              placeholder={unlimitedCancellations ? t('entitlements.unlimited') : undefined}
              onChange={(e) =>
                dispatch({
                  type: 'entitlements',
                  patch: { freeCancellations: Math.trunc(Number(e.target.value)) || 0 },
                })
              }
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={unlimitedCancellations}
                onChange={(e) =>
                  dispatch({
                    type: 'entitlements',
                    patch: { freeCancellations: e.target.checked ? null : 0 },
                  })
                }
              />
              {t('entitlements.unlimited')}
            </label>
          </div>
        </div>

        <div className="field checkbox-group">
          <label className="checkbox-label">
            <Switch
              checked={entitlements.bookingFeeWaived}
              onChange={(bookingFeeWaived) =>
                dispatch({ type: 'entitlements', patch: { bookingFeeWaived } })
              }
            />
            {t('entitlements.bookingFeeWaived')}
            <FieldInfo text={t('entitlements.info.bookingFeeWaived')} />
          </label>
        </div>

        <div className="field">
          <span className="field__label">
            {t('entitlements.features')}
            <FieldInfo text={t('entitlements.info.features')} />
          </span>
          <div className="checkbox-group">
            {DRIVER_SUBSCRIPTION_FEATURES.map((feature) => (
              <label key={feature} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={entitlements.features.includes(feature)}
                  onChange={(e) => toggleFeature(feature, e.target.checked)}
                />
                {t(`entitlements.featureLabels.${feature}`)}
              </label>
            ))}
          </div>
        </div>
      </section>

      <div className="form-actions">
        <SubmitButton mode={mode} />
      </div>
    </form>
  )
}
