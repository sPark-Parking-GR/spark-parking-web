'use client'

import { useRouter } from 'next/navigation'
import type { AdminFacilityListItem } from '@/lib/api'

interface Props {
  facilities: AdminFacilityListItem[]
  selectedId: string
}

export function FacilitySelect({ facilities, selectedId }: Props) {
  const router = useRouter()

  return (
    <label className="field facility-select">
      <span className="field__label">Facility</span>
      <select
        className="input"
        value={selectedId}
        onChange={(e) => {
          const id = e.target.value
          router.push(id ? `/dashboard/tariffs?facilityId=${encodeURIComponent(id)}` : '/dashboard/tariffs')
        }}
      >
        <option value="">Select a facility…</option>
        {facilities.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
    </label>
  )
}
