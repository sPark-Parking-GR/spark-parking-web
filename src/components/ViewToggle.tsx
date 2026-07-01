'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { List, Map as MapIcon } from 'lucide-react'

const VIEWS = [
  { value: 'table', label: 'Table', Icon: List },
  { value: 'map', label: 'Map', Icon: MapIcon },
] as const

export function ViewToggle() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const active = searchParams.get('view') === 'map' ? 'map' : 'table'

  const select = (view: string) => {
    if (view === active) return
    const params = new URLSearchParams(searchParams)
    if (view === 'map') params.set('view', 'map')
    else params.delete('view')
    const qs = params.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <div className="segmented view-toggle" role="tablist" aria-label="View">
      {VIEWS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={active === value}
          className={`segmented__item${active === value ? ' segmented__item--active' : ''}`}
          onClick={() => select(value)}
        >
          <Icon size={15} strokeWidth={2} aria-hidden="true" />
          <span className="segmented__label">{label}</span>
        </button>
      ))}
    </div>
  )
}
