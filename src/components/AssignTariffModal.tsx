'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Info } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { VEHICLE_ICON } from './vehicle-icons'
import type {
  AssignTariffInput,
  FacilityTariffAssignment,
  FacilityTariffPlan,
  FacilityVehicleType,
} from '@/lib/api'
import type { VehicleType } from '@spark/types'

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

const VEHICLE_TYPES: FacilityVehicleType[] = ['CAR', 'MOTORCYCLE', 'VAN', 'TRUCK']

function rowsFor(
  t: ReturnType<typeof useTranslations>,
): { vehicleType: FacilityVehicleType; label: string }[] {
  return [
    { vehicleType: 'CAR', label: t('vehicleTypes.car') },
    { vehicleType: 'MOTORCYCLE', label: t('vehicleTypes.motorcycle') },
    { vehicleType: 'VAN', label: t('vehicleTypes.van') },
    { vehicleType: 'TRUCK', label: t('vehicleTypes.truck') },
  ]
}

function feasiblePlans(
  plans: FacilityTariffPlan[],
  vehicleType: FacilityVehicleType,
): FacilityTariffPlan[] {
  // Plan.vehicleTypes comes from the tariff-plan wire contract (lowercase, e.g. "car"),
  // while facility-assignment vehicle types are uppercase ("CAR") — normalize to compare.
  return plans.filter(
    (p) =>
      p.vehicleTypes.length === 0 || p.vehicleTypes.some((v) => v.toUpperCase() === vehicleType),
  )
}

function initialSelection(
  assignments: FacilityTariffAssignment[] | null,
  plans: FacilityTariffPlan[],
): Record<string, string> {
  const selection: Record<string, string> = {}
  for (const vehicleType of VEHICLE_TYPES) {
    if (!assignments) {
      selection[vehicleType] = NO_CHANGE
      continue
    }
    const current = assignments.find((a) => a.vehicleType === vehicleType)
    if (current && current.source === 'explicit' && current.tariffPlanId) {
      selection[vehicleType] = current.tariffPlanId
      continue
    }
    const feasible = feasiblePlans(plans, vehicleType)
    selection[vehicleType] = feasible.length === 1 ? (feasible[0]?.id ?? NO_PLAN) : NO_PLAN
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
  const t = useTranslations('facilities')
  const ROWS = rowsFor(t)
  const isBulk = initialAssignments === null

  const [selection, setSelection] = useState<Record<string, string>>(() =>
    initialSelection(initialAssignments, plans),
  )

  useEffect(() => {
    if (open) setSelection(initialSelection(initialAssignments, plans))
  }, [open, initialAssignments, plans])

  const handleSubmit = () => {
    const assignments: AssignTariffInput[] = []
    for (const vehicleType of VEHICLE_TYPES) {
      const value = selection[vehicleType] ?? NO_CHANGE
      const initial = initialAssignments
        ? (() => {
            const current = initialAssignments.find((a) => a.vehicleType === vehicleType)
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
        vehicleType,
        tariffPlanId: value === NO_PLAN ? null : value,
      })
    }
    onSubmit(assignments)
  }

  const helpText = isBulk ? t('assignModal.helpTextBulk') : t('assignModal.helpTextSingle')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      wide
      titleAccessory={
        <span className="modal__info" tabIndex={0} data-tooltip={helpText}>
          <Info size={16} strokeWidth={2} aria-label={helpText} />
        </span>
      }
    >
      <p className="modal__text">{description}</p>

      {error ? (
        <div className="form-banner form-banner--error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="assign-rows">
        {ROWS.map((row) => {
          const options = feasiblePlans(plans, row.vehicleType)
          const value = selection[row.vehicleType] ?? NO_CHANGE
          const hasPlan = value !== NO_CHANGE && value !== NO_PLAN
          const Icon = VEHICLE_ICON[row.vehicleType.toLowerCase() as VehicleType]
          return (
            <div key={row.vehicleType} className="assign-row">
              <span className={`assign-row__icon${hasPlan ? ' assign-row__icon--assigned' : ''}`}>
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <label className="assign-row__field">
                <span className="field__label">{row.label}</span>
                <select
                  className="input"
                  value={value}
                  onChange={(e) =>
                    setSelection((prev) => ({ ...prev, [row.vehicleType]: e.target.value }))
                  }
                  disabled={pending}
                >
                  {isBulk ? <option value={NO_CHANGE}>{t('assignModal.noChange')}</option> : null}
                  <option value={NO_PLAN}>{t('tariff.noPlan')}</option>
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
      </div>

      {isBulk ? (
        <p className="assign-rows__footnote">{t('assignModal.bulkFallbackHint')}</p>
      ) : (
        <div className="assign-row assign-row--footnote">
          <span className="assign-row__icon assign-row__icon--muted">
            <Info size={18} strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="assign-row__field">
            <span className="field__label">{t('assignModal.allOtherVehicleTypes')}</span>
            {defaultPlan ? (
              <Link href={`/dashboard/tariffs/${defaultPlan.id}`} className="table-link">
                {defaultPlan.name}
              </Link>
            ) : (
              <span className="text-secondary">{t('assignModal.noDefaultSet')}</span>
            )}
          </div>
        </div>
      )}

      <div className="modal__footer">
        <button type="button" className="btn btn--secondary" onClick={onClose} disabled={pending}>
          {t('actions.cancel')}
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={pending}
          onClick={handleSubmit}
        >
          {pending ? (
            <>
              <Spinner size={15} />
              {t('form.saving')}
            </>
          ) : (
            t('assignModal.assign')
          )}
        </button>
      </div>
    </Modal>
  )
}
