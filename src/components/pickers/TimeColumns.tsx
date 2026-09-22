'use client'

import { useEffect, useRef } from 'react'

interface Props {
  hour: number
  minute: number
  onChange: (hour: number, minute: number) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function TimeColumns({ hour, minute, onChange }: Props) {
  const hourCol = useRef<HTMLDivElement>(null)
  const minuteCol = useRef<HTMLDivElement>(null)
  const hourActive = useRef<HTMLButtonElement>(null)
  const minuteActive = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const center = (col: HTMLDivElement | null, opt: HTMLButtonElement | null) => {
      if (!col || !opt) return
      col.scrollTop = opt.offsetTop - col.clientHeight / 2 + opt.clientHeight / 2
    }
    center(hourCol.current, hourActive.current)
    center(minuteCol.current, minuteActive.current)
  }, [])

  return (
    <div className="timecols">
      <div className="timecol" ref={hourCol} role="listbox" aria-label="Hour">
        {HOURS.map((h) => (
          <button
            key={h}
            type="button"
            ref={h === hour ? hourActive : undefined}
            className={`timecol__opt${h === hour ? ' timecol__opt--active' : ''}`}
            onClick={() => onChange(h, minute)}
          >
            {pad(h)}
          </button>
        ))}
      </div>
      <div className="timecol" ref={minuteCol} role="listbox" aria-label="Minute">
        {MINUTES.map((m) => (
          <button
            key={m}
            type="button"
            ref={m === minute ? minuteActive : undefined}
            className={`timecol__opt${m === minute ? ' timecol__opt--active' : ''}`}
            onClick={() => onChange(hour, m)}
          >
            {pad(m)}
          </button>
        ))}
      </div>
    </div>
  )
}
