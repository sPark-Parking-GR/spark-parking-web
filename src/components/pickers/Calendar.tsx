'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthLabel, sameDay } from '@/lib/datetime'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

interface Props {
  value: Date | null
  onSelect: (date: Date) => void
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function Calendar({ value, onSelect }: Props) {
  const today = new Date()
  const [view, setView] = useState(() => startOfMonth(value ?? today))

  const first = startOfMonth(view)
  const leading = (first.getDay() + 6) % 7
  const gridStart = new Date(first)
  gridStart.setDate(1 - leading)

  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })

  function shift(delta: number) {
    setView(new Date(view.getFullYear(), view.getMonth() + delta, 1))
  }

  return (
    <div className="calendar">
      <div className="calendar__head">
        <button
          type="button"
          className="calendar__nav"
          onClick={() => shift(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} strokeWidth={2.25} aria-hidden="true" />
        </button>
        <span className="calendar__title">{monthLabel(view)}</span>
        <button
          type="button"
          className="calendar__nav"
          onClick={() => shift(1)}
          aria-label="Next month"
        >
          <ChevronRight size={16} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>

      <div className="calendar__grid calendar__grid--head">
        {WEEKDAYS.map((w) => (
          <span key={w} className="calendar__weekday">
            {w}
          </span>
        ))}
      </div>

      <div className="calendar__grid">
        {days.map((d, i) => {
          const muted = d.getMonth() !== view.getMonth()
          const selected = value ? sameDay(d, value) : false
          const isToday = sameDay(d, today)
          const cls = [
            'calendar__day',
            muted ? 'calendar__day--muted' : '',
            isToday ? 'calendar__day--today' : '',
            selected ? 'calendar__day--selected' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button key={i} type="button" className={cls} onClick={() => onSelect(d)}>
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
