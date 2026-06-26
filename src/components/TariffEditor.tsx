'use client'

import { useActionState, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
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
import type { TariffActionResult } from '@/lib/tariff-actions'
import type {
  TariffCap,
  TariffDraft,
  TariffRate,
  TariffTier,
  TariffWindow,
  SimulateResult,
} from '@/lib/tariff-api'
import type { VehicleType } from '@spark/types'

interface Props {
  mode: 'create' | 'edit'
  facilityId: string
  planId?: string
  plan?: TariffDraft
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
    case 'meta':
      return { ...draft, ...action.patch }
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
  return (
    <button type="submit" className="btn btn--primary" disabled={pending}>
      {pending ? 'Saving…' : mode === 'create' ? 'Create plan' : 'Save changes'}
    </button>
  )
}

export function TariffEditor({ mode, facilityId, planId, plan }: Props) {
  const [draft, dispatch] = useReducer(reducer, plan as TariffDraft)

  const boundSave = useMemo(
    () => saveTariffPlanAction.bind(null, facilityId, planId ?? null),
    [facilityId, planId],
  )
  const [state, formAction] = useActionState(boundSave, INITIAL_STATE)

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
      simulateTariffAction(facilityId, { draft, startsAt, endsAt, vehicleType })
        .then((res) => {
          if (id === runId.current) setSimResult(res)
        })
        .catch(() => {
          if (id === runId.current) setSimResult({ ok: false, error: 'Could not compute a quote.' })
        })
        .finally(() => {
          if (id === runId.current) setSimPending(false)
        })
    }, SIM_DEBOUNCE_MS)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, startsAt, endsAt, vehicleType, facilityId])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!clientValidation.ok) {
      e.preventDefault()
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="tariff-editor">
      <input type="hidden" name="draft" value={draftKey} />

      <div className="tariff-editor__left">
        {state && !state.ok ? (
          <p className="form-banner form-banner--error" role="alert">
            <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
            {state.error}
          </p>
        ) : null}

        {!clientValidation.ok ? (
          <div className="form-banner form-banner--warning" role="status">
            <AlertTriangle size={18} strokeWidth={2} aria-hidden="true" />
            <div className="form-banner__body">
              <strong>Fix before saving</strong>
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
    </form>
  )
}
