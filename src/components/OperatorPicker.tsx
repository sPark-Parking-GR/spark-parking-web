'use client'

import { useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

export interface OperatorPickerOption {
  id: string
  name: string
  subtitle: string
}

interface Props {
  operators: OperatorPickerOption[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  noResultsLabel: string
  disabled?: boolean
  className?: string
}

export function OperatorPicker({
  operators,
  value,
  onChange,
  placeholder,
  noResultsLabel,
  disabled,
  className,
}: Props) {
  const listId = useId()
  const selected = operators.find((o) => o.id === value) ?? null
  const [query, setQuery] = useState(selected?.name ?? '')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || query === selected?.name) return operators
    return operators.filter((o) => o.name.toLowerCase().includes(q))
  }, [operators, query, selected])

  function select(operator: OperatorPickerOption) {
    onChange(operator.id)
    setQuery(operator.name)
    setOpen(false)
    setHighlighted(-1)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (highlighted >= 0) {
        e.preventDefault()
        const operator = filtered[highlighted]
        if (operator) select(operator)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div
      className="address-autocomplete"
      ref={containerRef}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
          setOpen(false)
          setQuery(selected?.name ?? '')
        }
      }}
    >
      <input
        className={className}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange('')
          setOpen(true)
          setHighlighted(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listId}
      />
      {open ? (
        <ul id={listId} className="address-autocomplete__list" role="listbox">
          {filtered.length === 0 ? (
            <li className="address-autocomplete__option">
              <span className="address-autocomplete__secondary">{noResultsLabel}</span>
            </li>
          ) : (
            filtered.map((operator, i) => (
              <li
                key={operator.id}
                role="option"
                aria-selected={i === highlighted}
                className={`address-autocomplete__option${i === highlighted ? ' is-highlighted' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  select(operator)
                }}
                onMouseEnter={() => setHighlighted(i)}
              >
                <span className="address-autocomplete__main">{operator.name}</span>
                <span className="address-autocomplete__secondary">{operator.subtitle}</span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
