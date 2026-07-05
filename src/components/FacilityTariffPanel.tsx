'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

const ROWS: { vehicleType: FacilityTariffAssignment['vehicleType']; label: string }[] = [
  { vehicleType: 'CAR', label: 'Car' },
  { vehicleType: 'MOTORCYCLE', label: 'Motorcycle' },
  { vehicleType: 'VAN', label: 'Van' },
  { vehicleType: 'TRUCK', label: 'Truck' },
]

export function FacilityTariffPanel({ facilityId, assignments, defaultPlan, tariffPlans }: Props) {
  const router = useRouter()
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
        <h3 className="h-heading">Tariff plans</h3>
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
              <th>Vehicle type</th>
              <th>Tariff plan</th>
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
                          <span className="badge badge--info">Default</span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-secondary">No tariff plan</span>
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
        Change tariff plans
      </button>

      <AssignTariffModal
        open={open}
        onClose={() => setOpen(false)}
        title="Assign tariff plans"
        description="Choose the tariff plan customers are billed under, per vehicle type, at this facility."
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
