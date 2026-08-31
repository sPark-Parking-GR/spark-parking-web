'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Banknote, ChevronRight } from 'lucide-react'
import { AssignTariffModal } from './AssignTariffModal'
import { VEHICLE_ICON } from './vehicle-icons'
import { bulkFacilityAction } from '@/lib/facility-actions'
import type { AssignTariffInput, FacilityTariffAssignment, FacilityTariffPlan } from '@/lib/api'
import type { VehicleType } from '@spark/types'

interface Props {
  facilityId: string
  assignments: FacilityTariffAssignment[]
  defaultPlan: { id: string; name: string } | null
  tariffPlans: FacilityTariffPlan[]
  acceptedVehicleTypes: FacilityTariffAssignment['vehicleType'][]
}

export function FacilityTariffPanel({
  facilityId,
  assignments,
  defaultPlan,
  tariffPlans,
  acceptedVehicleTypes,
}: Props) {
  const t = useTranslations('facilities')
  const router = useRouter()

  const ROWS: { vehicleType: FacilityTariffAssignment['vehicleType']; label: string }[] = [
    { vehicleType: 'CAR', label: t('vehicleTypes.car') },
    { vehicleType: 'MOTORCYCLE', label: t('vehicleTypes.motorcycle') },
    { vehicleType: 'VAN', label: t('vehicleTypes.van') },
    { vehicleType: 'TRUCK', label: t('vehicleTypes.truck') },
  ]
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const submit = (rows: AssignTariffInput[]) => {
    if (rows.length === 0) {
      setOpen(false)
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await bulkFacilityAction('assignTariff', [facilityId], rows)
      if (!res.ok) {
        setError(res.detail ?? t(res.errorKey))
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <section className="editor-section card">
      <div className="editor-section__head">
        <h3 className="h-heading">{t('tariff.heading')}</h3>
      </div>

      {error ? (
        <div className="form-banner form-banner--error" role="alert">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        className="tariff-strip"
        onClick={() => setOpen(true)}
        aria-label={t('tariff.changePlans')}
      >
        <div className="tariff-strip__icons">
          {ROWS.map((row) => {
            const assignment = assignments.find((a) => a.vehicleType === row.vehicleType)
            const hasPlan = Boolean(
              assignment && assignment.source !== 'none' && assignment.tariffPlanId,
            )
            const tooltip = hasPlan ? assignment!.tariffPlanName : t('tariff.noPlan')
            const Icon = VEHICLE_ICON[row.vehicleType.toLowerCase() as VehicleType]
            return (
              <span
                key={row.vehicleType}
                className={`tariff-strip__icon${hasPlan ? ' tariff-strip__icon--assigned' : ''}`}
                data-tooltip={`${row.label}: ${tooltip}`}
              >
                <Icon size={20} strokeWidth={2} aria-hidden="true" />
              </span>
            )
          })}
        </div>
        <span className="tariff-strip__hint">
          <Banknote size={15} strokeWidth={2} aria-hidden="true" />
          {t('tariff.changePlans')}
          <ChevronRight
            size={16}
            strokeWidth={2}
            className="tariff-strip__chevron"
            aria-hidden="true"
          />
        </span>
      </button>

      <AssignTariffModal
        open={open}
        onClose={() => setOpen(false)}
        title={t('tariff.assignPlansTitle')}
        description={t('tariff.assignPlansDescription')}
        plans={tariffPlans}
        initialAssignments={assignments}
        defaultPlan={defaultPlan}
        acceptedVehicleTypes={acceptedVehicleTypes}
        pending={pending}
        error={null}
        onSubmit={submit}
      />
    </section>
  )
}
