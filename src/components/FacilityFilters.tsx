'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Spinner } from './Spinner'
import { KIND_OPTIONS } from '@/lib/facility-display'

const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const VERIFIED_OPTIONS = [
  { value: '', label: 'Any verification' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
]

export function FacilityFilters() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('skip')
    const qs = params.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <div className="filter-bar">
      <select
        className="input filter-bar__select"
        aria-label="Filter by status"
        value={searchParams.get('status') ?? ''}
        onChange={(e) => setParam('status', e.target.value)}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        className="input filter-bar__select"
        aria-label="Filter by verification"
        value={searchParams.get('verified') ?? ''}
        onChange={(e) => setParam('verified', e.target.value)}
      >
        {VERIFIED_OPTIONS.map((o) => (
          <option key={o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        className="input filter-bar__select"
        aria-label="Filter by kind"
        value={searchParams.get('kind') ?? ''}
        onChange={(e) => setParam('kind', e.target.value)}
      >
        <option value="">Any kind</option>
        {KIND_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {isPending ? <Spinner size={15} className="filter-bar__spinner" /> : null}
    </div>
  )
}
