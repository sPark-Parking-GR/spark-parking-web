'use client'

import { useRef, useState } from 'react'
import { CalendarDays, Clock } from 'lucide-react'
import { Popover } from './Popover'
import { Calendar } from './Calendar'
import { TimeColumns } from './TimeColumns'
import {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatHHMM,
  parseDateOnly,
  parseHHMM,
  parseLocalInput,
  toDateOnly,
  toLocalInput,
} from '@/lib/datetime'

type Mode = 'date' | 'time' | 'datetime'

interface Props {
  mode: Mode
  value: string
  onChange: (value: string) => void
  name?: string
  disabled?: boolean
  ariaLabel?: string
  placeholder?: string
}

function defaultBase(): Date {
  const d = new Date()
  d.setHours(8, 0, 0, 0)
  return d
}

function currentDate(mode: Mode, value: string): Date | null {
  if (mode === 'time') {
    const parsed = parseHHMM(value)
    if (!parsed) return null
    const d = defaultBase()
    d.setHours(parsed.hour, parsed.minute, 0, 0)
    return d
  }
  if (mode === 'date') return parseDateOnly(value)
  return parseLocalInput(value)
}

function displayValue(mode: Mode, value: string): string {
  if (mode === 'time') return value
  if (mode === 'date') return formatDateDisplay(value)
  return formatDateTimeDisplay(value)
}

export function DateTimePicker({
  mode,
  value,
  onChange,
  name,
  disabled,
  ariaLabel,
  placeholder,
}: Props) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const current = currentDate(mode, value)
  const base = current ?? (mode === 'date' ? new Date() : defaultBase())
  const display = displayValue(mode, value)

  function emit(date: Date) {
    if (mode === 'time') onChange(formatHHMM(date.getHours(), date.getMinutes()))
    else if (mode === 'date') onChange(toDateOnly(date))
    else onChange(toLocalInput(date))
  }

  function selectDate(picked: Date) {
    const next = new Date(base)
    next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate())
    emit(next)
    if (mode === 'date') setOpen(false)
  }

  function selectTime(hour: number, minute: number) {
    const next = new Date(base)
    next.setHours(hour, minute, 0, 0)
    emit(next)
  }

  const Icon = mode === 'time' ? Clock : CalendarDays
  const showCalendar = mode === 'date' || mode === 'datetime'
  const showTime = mode === 'time' || mode === 'datetime'

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="input picker-trigger"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span
          className={`picker-trigger__value${display ? '' : ' picker-trigger__value--placeholder'}`}
        >
          {display || placeholder || 'Select…'}
        </span>
        <Icon size={16} strokeWidth={2} className="picker-trigger__icon" aria-hidden="true" />
      </button>

      {name ? <input type="hidden" name={name} value={value} /> : null}

      <Popover open={open && !disabled} anchorRef={triggerRef} onClose={() => setOpen(false)}>
        <div className={`picker-pop${mode === 'datetime' ? ' picker-pop--split' : ''}`}>
          {showCalendar ? <Calendar value={current} onSelect={selectDate} /> : null}
          {showTime ? (
            <div className="picker-pop__time">
              {mode === 'datetime' ? <span className="picker-pop__label">Time</span> : null}
              <TimeColumns
                hour={base.getHours()}
                minute={base.getMinutes()}
                onChange={selectTime}
              />
            </div>
          ) : null}
        </div>
        <div className="picker-pop__footer">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setOpen(false)}
          >
            Done
          </button>
        </div>
      </Popover>
    </>
  )
}
