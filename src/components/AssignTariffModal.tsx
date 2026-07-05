'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import type { AssignTariffInput, FacilityTariffAssignment, FacilityTariffPlan, FacilityVehicleType } from '@/lib/api'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  description: string
  plans: FacilityTariffPlan[]
  initialAssignments: FacilityTariffAssignment[] | null
  defaultPlan?: { id: string; name: string } | null
  pending: boolean
  error: string | null
  onSubmit: (assignments: AssignTariffInput[]) => void
}

const NO_CHANGE = '__no_change__'
const NO_PLAN = '__no_plan__'

const ROWS: { vehicleType: FacilityVehicleType; label: string }[] = [
  { vehicleType: 'CAR', label: 'Car' },
  { vehicleType: 'MOTORCYCLE', label: 'Motorcycle' },
  { vehicleType: 'VAN', label: 'Van' },
  { vehicleType: 'TRUCK', label: 'Truck' },
]

function feasiblePlans(plans: FacilityTariffPlan[], vehicleType: FacilityVehicleType): FacilityTariffPlan[] {
  // Plan.vehicleTypes comes from the tariff-plan wire contract (lowercase, e.g. "car"),
  // while facility-assignment vehicle types are uppercase ("CAR") — normalize to compare.
  return plans.filter(
    (p) =>
      p.vehicleTypes.length === 0 ||
      p.vehicleTypes.some((v) => v.toUpperCase() === vehicleType),
  )
}

function initialSelection(
  assignments: FacilityTariffAssignment[] | null,
  plans: FacilityTariffPlan[],
): Record<string, string> {
  const selection: Record<string, string> = {}
  for (const row of ROWS) {
    if (!assignments) {
      selection[row.vehicleType] = NO_CHANGE
      continue
    }
    const current = assignments.find((a) => a.vehicleType === row.vehicleType)
    if (current && current.source === 'explicit' && current.tariffPlanId) {
      selection[row.vehicleType] = current.tariffPlanId
      continue
    }
    const feasible = feasiblePlans(plans, row.vehicleType)
    selection[row.vehicleType] = feasible.length === 1 ? (feasible[0]?.id ?? NO_PLAN) : NO_PLAN
  }
  return selection
}

export function AssignTariffModal({
  open,
  onClose,
  title,
  description,
  plans,
  initialAssignments,
  defaultPlan,
  pending,
  error,
  onSubmit,
}: Props) {
  const isBulk = initialAssignments === null

  const [selection, setSelection] = useState<Record<string, string>>(() =>
    initialSelection(initialAssignments, plans),
  )

  useEffect(() => {
    if (open) setSelection(initialSelection(initialAssignments, plans))
  }, [open, initialAssignments, plans])

  const handleSubmit = () => {
    const assignments: AssignTariffInput[] = []
    for (const row of ROWS) {
      const value = selection[row.vehicleType] ?? NO_CHANGE
      const initial = initialAssignments
        ? (() => {
            const current = initialAssignments.find((a) => a.vehicleType === row.vehicleType)
            return current && current.source === 'explicit' && current.tariffPlanId
              ? current.tariffPlanId
              : NO_PLAN
          })()
        : NO_CHANGE

      if (initialAssignments) {
        if (value === initial) continue
      } else if (value === NO_CHANGE) {
        continue
      }

      assignments.push({
        vehicleType: row.vehicleType,
        tariffPlanId: value === NO_PLAN ? null : value,
      })
    }
    onSubmit(assignments)
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="modal__text">
        Each dropdown only lists tariffs that can legally price that vehicle type. When exactly
        one qualifying tariff exists, it is pre-selected automatically, but it still needs an
        explicit Assign click to take effect. Any vehicle type left unset falls back to the
        operator&apos;s default plan{isBulk ? '' : ' (shown in the row below)'}.
      </p>
      <p className="modal__text">{description}</p>

      {error ? (
        <div className="form-banner form-banner--error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="editor-rows">
        {ROWS.map((row) => {
          const options = feasiblePlans(plans, row.vehicleType)
          return (
            <div key={row.vehicleType} className="editor-row">
              <label className="field">
                <span className="field__label">{row.label}</span>
                <select
                  className="input"
                  value={selection[row.vehicleType] ?? NO_CHANGE}
                  onChange={(e) =>
                    setSelection((prev) => ({ ...prev, [row.vehicleType]: e.target.value }))
                  }
                  disabled={pending}
                >
                  {isBulk ? <option value={NO_CHANGE}>No change</option> : null}
                  <option value={NO_PLAN}>No tariff plan</option>
                  {options.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )
        })}

        {isBulk ? (
          <p className="text-secondary editor-section__hint">
            Vehicle types left unassigned will fall back to each facility&apos;s own operator
            default plan.
          </p>
        ) : (
          <div className="editor-row">
            <div className="field">
              <span className="field__label">All other vehicle types</span>
              {defaultPlan ? (
                <Link href={`/dashboard/tariffs/${defaultPlan.id}`} className="table-link">
                  {defaultPlan.name}
                </Link>
              ) : (
                <span className="text-secondary">No default set</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="modal__footer">
        <button type="button" className="btn btn--secondary" onClick={onClose} disabled={pending}>
          Cancel
        </button>
        <button type="button" className="btn btn--primary" disabled={pending} onClick={handleSubmit}>
          {pending ? (
            <>
              <Spinner size={15} />
              Saving…
            </>
          ) : (
            'Assign'
          )}
        </button>
      </div>
    </Modal>
  )
}
