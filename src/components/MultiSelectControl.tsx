'use client'

import type { LucideIcon } from 'lucide-react'

interface Option {
  value: string
  label: string
  icon?: LucideIcon
}

interface Props {
  options: readonly Option[]
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  labelledBy?: string
  describedBy?: string
}

export function MultiSelectControl({
  options,
  value,
  onChange,
  disabled,
  labelledBy,
  describedBy,
}: Props) {
  function toggle(v: string) {
    if (disabled) return
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }

  return (
    <div
      className="segmented"
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {options.map((option) => {
        const active = value.includes(option.value)
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            className={`segmented__item${active ? ' segmented__item--active' : ''}`}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => toggle(option.value)}
          >
            {Icon ? <Icon size={19} strokeWidth={2} aria-hidden="true" /> : null}
            <span className="segmented__label">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
