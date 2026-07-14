'use client'

import { useActionState, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { saveTariffPlanAction } from '@/lib/tariff-actions'
import { simulateTariffAction } from '@/lib/tariff-actions'
import { tariffDraftSchema, buildRateGrid } from '@/lib/tariff-schema'
import { PlanMetaFields } from './PlanMetaFields'
import { WindowsEditor } from './WindowsEditor'
import { TiersEditor } from './TiersEditor'
import { RateGrid } from './RateGrid'
import { CapsEditor } from './CapsEditor'
import { QuoteSimulator } from './QuoteSimulator'
import { DefaultReplacementModal } from './DefaultReplacementModal'
import type { TariffActionResult } from '@/lib/tariff-actions'
import type {
  TariffCap,
  TariffDraft,
  TariffPlanListItem,
  TariffRate,
  TariffTier,
  TariffWindow,
  SimulateResult,
} from '@/lib/tariff-api'
import type { VehicleType } from '@spark/types'

interface Props {
  mode: 'create' | 'edit'
  planId?: string
  plan?: TariffDraft
  plans?: TariffPlanListItem[]
  isPlatformAdmin?: boolean
}

const INITIAL_STATE: TariffActionResult = { ok: true }
const SIM_DEBOUNCE_MS = 400

type Action =
  | { type: 'meta'; patch: Partial<TariffDraft> }
  | { type: 'windows'; windows: TariffWindow[] }
  | { type: 'tiers'; tiers: TariffTier[] }
  | { type: 'rate'; tierKey: string; windowKey: string; priceCents: number }
  | { type: 'currency'; currency: string }
  | { type: 'caps'; caps: TariffCap[] }

function planCurrency(draft: TariffDraft): string {
  return draft.rates[0]?.currency ?? 'EUR'
}

// WHY: tiers/windows define the grid shape; any structural edit re-runs
// buildRateGrid so new (tier×window) cells appear blank and orphaned cells drop,
// keeping rates a complete matrix in lock-step with the axes.
function reducer(draft: TariffDraft, action: Action): TariffDraft {
  switch (action.type) {
    case 'meta': {
      const merged = { ...draft, ...action.patch }
      if (action.patch.vehicleTypes && action.patch.vehicleTypes.length > 0 && draft.isDefault) {
        merged.isDefault = false
      }
      return merged
    }
    case 'windows':
      return {
        ...draft,
        windows: action.windows,
        rates: buildRateGrid(draft.tiers, action.windows, draft.rates, planCurrency(draft)),
      }
    case 'tiers':
      return {
        ...draft,
        tiers: action.tiers,
        rates: buildRateGrid(action.tiers, draft.windows, draft.rates, planCurrency(draft)),
      }
    case 'rate':
      return {
        ...draft,
        rates: draft.rates.map((r) =>
          r.tierKey === action.tierKey && r.windowKey === action.windowKey
            ? { ...r, priceCents: action.priceCents }
            : r,
        ),
      }
    case 'currency':
      return { ...draft, rates: draft.rates.map((r) => ({ ...r, currency: action.currency })) }
    case 'caps':
      return { ...draft, caps: action.caps }
    default:
      return draft
  }
}

function defaultSimWindow(): { startsAt: string; endsAt: string } {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  return { startsAt: fmt(start), endsAt: fmt(end) }
}

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus()
  const t = useTranslations('tariffs')
  return (
    <button type="submit" className="btn btn--primary" disabled={pending}>
      {pending ? t('editor.saving') : mode === 'create' ? t('editor.createPlan') : t('editor.saveChanges')}
    </button>
  )
}

interface ReplacementModalStatusProps {
  open: boolean
  candidates: { id: string; name: string }[]
  error: string | null
  onClose: () => void
  onConfirm: (candidateId: string) => void
}

function ReplacementModalStatus({
  open,
  candidates,
  error,
  onClose,
  onConfirm,
}: ReplacementModalStatusProps) {
  const { pending } = useFormStatus()
  return (
    <DefaultReplacementModal
      open={open}
      onClose={onClose}
      candidates={candidates}
      pending={pending}
      error={error}
      onConfirm={onConfirm}
    />
  )
}

export function TariffEditor({ mode, planId, plan, plans, isPlatformAdmin = false }: Props) {
  const t = useTranslations('tariffs')
  const [draft, dispatch] = useReducer(reducer, plan as TariffDraft)
  const [newDefaultPlanId, setNewDefaultPlanId] = useState<string | undefined>(undefined)
  const formRef = useRef<HTMLFormElement>(null)

  const boundSave = useMemo(
    () => saveTariffPlanAction.bind(null, planId ?? null, newDefaultPlanId),
    [planId, newDefaultPlanId],
  )
  const [state, formAction] = useActionState(boundSave, INITIAL_STATE)

  const replacementCandidates = useMemo(
    () =>
      (plans ?? [])
        .filter((p) => p.id !== planId && p.isActive && p.vehicleTypes.length === 0)
        .map((p) => ({ id: p.id, name: p.name })),
    [plans, planId],
  )

  function handleReplacementConfirm(candidateId: string) {
    setNewDefaultPlanId(candidateId)
  }

  // WHY: rebinding formAction with the chosen replacement id doesn't itself
  // resubmit the form — request it explicitly once the new bound action is live.
  useEffect(() => {
    if (newDefaultPlanId) {
      formRef.current?.requestSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundSave])

  const simWindow = useMemo(defaultSimWindow, [])
  const [startsAt, setStartsAt] = useState(simWindow.startsAt)
  const [endsAt, setEndsAt] = useState(simWindow.endsAt)
  const [vehicleType, setVehicleType] = useState<VehicleType>(draft.vehicleTypes[0] ?? 'car')

  const [simResult, setSimResult] = useState<SimulateResult | null>(null)
  const [simPending, setSimPending] = useState(false)

  const clientValidation = useMemo(() => {
    const parsed = tariffDraftSchema.safeParse(draft)
    return parsed.success
      ? { ok: true as const, issues: [] as string[] }
      : { ok: false as const, issues: parsed.error.issues.map((i) => i.message) }
  }, [draft])

  // WHY: the simulated vehicle must remain one the plan still accepts.
  useEffect(() => {
    if (!draft.vehicleTypes.includes(vehicleType) && draft.vehicleTypes[0]) {
      setVehicleType(draft.vehicleTypes[0])
    }
  }, [draft.vehicleTypes, vehicleType])

  const draftKey = JSON.stringify(draft)
  const runId = useRef(0)

  useEffect(() => {
    const handle = setTimeout(() => {
      const id = ++runId.current
      setSimPending(true)
      simulateTariffAction({ draft, startsAt, endsAt, vehicleType })
        .then((res) => {
          if (id === runId.current) setSimResult(res)
        })
        .catch(() => {
          if (id === runId.current) setSimResult({ ok: false, error: t('editor.simulationError') })
        })
        .finally(() => {
          if (id === runId.current) setSimPending(false)
        })
    }, SIM_DEBOUNCE_MS)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, startsAt, endsAt, vehicleType])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!clientValidation.ok) {
      e.preventDefault()
    }
  }

  const showReplacementModal = !state.ok && Boolean(state.requiresDefaultReplacement)

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="tariff-editor">
      <input type="hidden" name="draft" value={draftKey} />

      <div className="tariff-editor__left">
        {state && !state.ok && !state.requiresDefaultReplacement ? (
          <p className="form-banner form-banner--error" role="alert">
            <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
            {state.error}
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

        <PlanMetaFields draft={draft} onChange={(patch) => dispatch({ type: 'meta', patch })} />
        <WindowsEditor windows={draft.windows} onChange={(windows) => dispatch({ type: 'windows', windows })} />
        <TiersEditor tiers={draft.tiers} onChange={(tiers) => dispatch({ type: 'tiers', tiers })} />
        <RateGrid
          tiers={draft.tiers}
          windows={draft.windows}
          rates={draft.rates}
          currency={planCurrency(draft)}
          onChangeRate={(tierKey, windowKey, priceCents) =>
            dispatch({ type: 'rate', tierKey, windowKey, priceCents })
          }
          onChangeCurrency={(currency) => dispatch({ type: 'currency', currency })}
        />
        <CapsEditor caps={draft.caps} onChange={(caps) => dispatch({ type: 'caps', caps })} />

        {mode === 'create' && isPlatformAdmin ? (
          <section className="editor-section card">
            <div className="editor-section__head">
              <h3 className="h-heading">{t('visibility.heading')}</h3>
            </div>
            <label className="field">
              <span className="field__label">{t('visibility.operatorIdLabel')}</span>
              <input
                className="input"
                type="text"
                value={draft.operatorId ?? ''}
                onChange={(e) => dispatch({ type: 'meta', patch: { operatorId: e.target.value || undefined } })}
              />
            </label>
          </section>
        ) : null}

        <div className="form-actions">
          <SubmitButton mode={mode} />
        </div>
      </div>

      <div className="tariff-editor__right">
        <QuoteSimulator
          startsAt={startsAt}
          endsAt={endsAt}
          vehicleType={vehicleType}
          vehicleTypes={draft.vehicleTypes}
          result={simResult}
          pending={simPending}
          onChange={(patch) => {
            if (patch.startsAt !== undefined) setStartsAt(patch.startsAt)
            if (patch.endsAt !== undefined) setEndsAt(patch.endsAt)
            if (patch.vehicleType !== undefined) setVehicleType(patch.vehicleType)
          }}
        />
      </div>

      <ReplacementModalStatus
        open={showReplacementModal}
        candidates={replacementCandidates}
        error={!state.ok && newDefaultPlanId ? state.error : null}
        onClose={() => setNewDefaultPlanId(undefined)}
        onConfirm={handleReplacementConfirm}
      />
    </form>
  )
}
