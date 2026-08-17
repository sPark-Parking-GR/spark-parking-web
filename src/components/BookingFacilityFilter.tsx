'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Spinner } from './Spinner'

export interface BookingFacilityOption {
  id: string
  name: string
  operatorName: string | null
}

interface Props {
  facilities: BookingFacilityOption[]
}

export function BookingFacilityFilter({ facilities }: Props) {
  const t = useTranslations('bookings')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const setFacility = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set('facilityId', value)
    else params.delete('facilityId')
    params.delete('skip')
    const qs = params.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <div className="filter-bar">
      <select
        className="input filter-bar__select"
        aria-label={t('table.facility')}
        value={searchParams.get('facilityId') ?? ''}
        onChange={(e) => setFacility(e.target.value)}
      >
        <option value="">{t('filters.all')}</option>
        {facilities.map((f) => (
          <option key={f.id} value={f.id}>
            {f.operatorName ? `${f.name} · ${f.operatorName}` : f.name}
          </option>
        ))}
      </select>
      {isPending ? <Spinner size={15} className="filter-bar__spinner" /> : null}
    </div>
  )
}
