'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Banknote } from 'lucide-react'
import { AssignTariffModal } from './AssignTariffModal'
import { bulkFacilityAction } from '@/lib/facility-actions'
import type { AssignTariffInput, FacilityTariffAssignment, FacilityTariffPlan } from '@/lib/api'

interface Props {
  facilityId: string
  assignments: FacilityTariffAssignment[]
  defaultPlan: { id: string; name: string } | null
  tariffPlans: FacilityTariffPlan[]
}

export function FacilityTariffPanel({ facilityId, assignments, defaultPlan, tariffPlans }: Props) {
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
        setError(res.error)
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

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>{t('tariff.vehicleTypeCol')}</th>
              <th>{t('tariff.tariffPlanCol')}</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const assignment = assignments.find((a) => a.vehicleType === row.vehicleType)
              return (
                <tr key={row.vehicleType}>
                  <td>{row.label}</td>
                  <td>
                    {assignment && assignment.source !== 'none' && assignment.tariffPlanId ? (
                      <>
                        <Link href={`/dashboard/tariffs/${assignment.tariffPlanId}`} className="table-link">
                          {assignment.tariffPlanName}
                        </Link>
                        {assignment.source === 'default' ? (
                          <span className="badge badge--info">{t('tariff.default')}</span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-secondary">{t('tariff.noPlan')}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button type="button" className="btn btn--secondary" onClick={() => setOpen(true)}>
        <Banknote size={15} strokeWidth={2} aria-hidden="true" />
        {t('tariff.changePlans')}
      </button>

      <AssignTariffModal
        open={open}
        onClose={() => setOpen(false)}
        title={t('tariff.assignPlansTitle')}
        description={t('tariff.assignPlansDescription')}
        plans={tariffPlans}
        initialAssignments={assignments}
        defaultPlan={defaultPlan}
        pending={pending}
        error={null}
        onSubmit={submit}
      />
    </section>
  )
}
