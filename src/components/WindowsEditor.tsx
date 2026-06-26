'use client'

import {
  DAY_BITS,
  WEEKDAY_LABELS,
  ALL_DAYS_MASK,
  minutesToHHMM,
  hhmmToMinutes,
  makeKey,
} from '@/lib/tariff-schema'
import { DateTimePicker } from '@/components/pickers/DateTimePicker'
import type { TariffWindow } from '@/lib/tariff-api'

interface Props {
  windows: TariffWindow[]
  onChange: (windows: TariffWindow[]) => void
}

// WHY: a day is fully covered only when, across all windows including that day,
// the [start,end) ranges (wrapping past midnight) union to the entire [0,1440).
function dayIsCovered(windows: TariffWindow[], bit: number): boolean {
  const segments: Array<[number, number]> = []
  for (const w of windows) {
    if ((w.dayMask & bit) === 0) continue
    if (w.endMinute > w.startMinute) {
      segments.push([w.startMinute, w.endMinute])
    } else {
      segments.push([w.startMinute, 1440])
      segments.push([0, w.endMinute])
    }
  }
  segments.sort((a, b) => a[0] - b[0])
  let reached = 0
  for (const [start, end] of segments) {
    if (start > reached) return false
    reached = Math.max(reached, end)
    if (reached >= 1440) return true
  }
  return reached >= 1440
}

export function WindowsEditor({ windows, onChange }: Props) {
  function update(index: number, patch: Partial<TariffWindow>) {
    onChange(windows.map((w, i) => (i === index ? { ...w, ...patch } : w)))
  }

  function toggleDay(index: number, bit: number) {
    const current = windows[index]
    if (!current) return
    const nextMask = (current.dayMask & bit) === bit ? current.dayMask & ~bit : current.dayMask | bit
    update(index, { dayMask: nextMask })
  }

  function addWindow() {
    onChange([
      ...windows,
      { key: makeKey(), label: 'New window', dayMask: ALL_DAYS_MASK, startMinute: 0, endMinute: 1440 },
    ])
  }

  function removeWindow(index: number) {
    onChange(windows.filter((_, i) => i !== index))
  }

  const uncoveredDays = WEEKDAY_LABELS.filter((_, i) => {
    const bit = DAY_BITS[i] ?? 0
    const usedByAny = windows.some((w) => (w.dayMask & bit) !== 0)
    return usedByAny && !dayIsCovered(windows, bit)
  })

  return (
    <section className="editor-section card">
      <div className="editor-section__head">
        <h3 className="h-heading">Windows</h3>
        <p className="text-secondary editor-section__hint">
          Time-of-day slots per weekday. Start is inclusive, end exclusive; end ≤ start wraps past midnight.
        </p>
      </div>

      <div className="editor-rows">
        {windows.map((win, i) => (
          <div key={win.key} className="editor-row windows-row">
            <label className="field windows-row__label">
              <span className="field__label">Label</span>
              <input
                className="input"
                type="text"
                value={win.label}
                onChange={(e) => update(i, { label: e.target.value })}
              />
            </label>

            <div className="field">
              <span className="field__label">Days</span>
              <div className="weekday-chips">
                {WEEKDAY_LABELS.map((label, di) => {
                  const bit = DAY_BITS[di] ?? 0
                  const active = (win.dayMask & bit) === bit
                  return (
                    <button
                      key={label}
                      type="button"
                      className={`weekday-chip${active ? ' weekday-chip--active' : ''}`}
                      onClick={() => toggleDay(i, bit)}
                      aria-pressed={active}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="field windows-row__time">
              <span className="field__label">Start</span>
              <DateTimePicker
                mode="time"
                value={minutesToHHMM(win.startMinute)}
                onChange={(v) => update(i, { startMinute: hhmmToMinutes(v) })}
                ariaLabel="Window start"
              />
            </div>

            <div className="field windows-row__time">
              <span className="field__label">End</span>
              <DateTimePicker
                mode="time"
                value={minutesToHHMM(win.endMinute)}
                onChange={(v) => update(i, { endMinute: hhmmToMinutes(v) })}
                ariaLabel="Window end"
              />
            </div>

            <button
              type="button"
              className="row-btn row-btn--remove"
              onClick={() => removeWindow(i)}
              disabled={windows.length <= 1}
              aria-label="Remove window"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {uncoveredDays.length > 0 ? (
        <p className="editor-warning" role="status">
          These days are not fully covered across 24h: {uncoveredDays.join(', ')}. Pricing will be rejected
          until every active day is fully covered.
        </p>
      ) : null}

      <button type="button" className="row-btn row-btn--add" onClick={addWindow}>
        + Add window
      </button>
    </section>
  )
}
