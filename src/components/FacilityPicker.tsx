'use client'

import { useEffect, useRef, useState, useTransition, type KeyboardEvent, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { Popover } from './pickers/Popover'
import { Spinner } from './Spinner'
import { searchFacilitiesAction, type FacilityOption } from '@/lib/facility-actions'
import { useDebouncedCallback } from '@/lib/use-debounced-callback'

interface Props {
  selected: { id: string; name: string } | null
}

const BASE = '/dashboard/tariffs'

export function FacilityPicker({ selected }: Props) {
  const router = useRouter()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<FacilityOption[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const [, startTransition] = useTransition()

  const load = useDebouncedCallback(async (q: string) => {
    setLoading(true)
    const items = await searchFacilitiesAction(q)
    setOptions(items)
    setActive(0)
    setLoading(false)
  }, 250)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    load(query)
    // load only when opening; query typing triggers its own debounced load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onType = (v: string) => {
    setQuery(v)
    load(v)
  }

  const choose = (id: string) => {
    setOpen(false)
    startTransition(() =>
      router.push(id ? `${BASE}?facilityId=${encodeURIComponent(id)}` : BASE),
    )
  }

  const clear = (e: MouseEvent) => {
    e.stopPropagation()
    choose('')
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = options[active]
      if (opt) choose(opt.id)
    }
  }

  return (
    <div className="field facility-select">
      <span className="field__label">Facility</span>
      <button
        ref={anchorRef}
        type="button"
        className="input picker-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={`picker-trigger__value${selected ? '' : ' picker-trigger__value--placeholder'}`}
        >
          {selected ? selected.name : 'Select a facility…'}
        </span>
        {selected ? (
          <span
            className="picker-trigger__clear"
            role="button"
            tabIndex={-1}
            aria-label="Clear selection"
            onClick={clear}
          >
            <X size={15} strokeWidth={2} aria-hidden="true" />
          </span>
        ) : (
          <ChevronsUpDown size={16} strokeWidth={2} className="picker-trigger__icon" aria-hidden="true" />
        )}
      </button>

      <Popover open={open} anchorRef={anchorRef} onClose={() => setOpen(false)}>
        <div className="picker-menu" onKeyDown={onKeyDown}>
          <div className="search-field picker-menu__search">
            <Search size={16} strokeWidth={2} className="search-field__icon" aria-hidden="true" />
            <input
              ref={inputRef}
              className="input search-field__input"
              type="search"
              placeholder="Search active facilities…"
              value={query}
              onChange={(e) => onType(e.target.value)}
            />
            {loading ? <Spinner size={15} className="search-field__spinner" /> : null}
          </div>
          <ul className="picker-list" role="listbox">
            {options.length === 0 && !loading ? (
              <li className="picker-empty">No facilities found</li>
            ) : (
              options.map((o, i) => (
                <li key={o.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected?.id === o.id}
                    className={`picker-option${i === active ? ' picker-option--active' : ''}${
                      selected?.id === o.id ? ' picker-option--selected' : ''
                    }`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(o.id)}
                  >
                    <span className="picker-option__text">
                      <span className="picker-option__name">{o.name}</span>
                      <span className="picker-option__addr">{o.address}</span>
                    </span>
                    {selected?.id === o.id ? (
                      <Check size={15} strokeWidth={2} aria-hidden="true" />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </Popover>
    </div>
  )
}
