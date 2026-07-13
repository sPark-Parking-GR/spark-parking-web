'use client'

import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  DAY_BITS,
  WEEKDAY_LABELS,
  ALL_DAYS_MASK,
  minutesToHHMM,
  hhmmToMinutes,
  makeKey,
} from '@/lib/tariff-schema'
import { DateTimePicker } from '@/components/pickers/DateTimePicker'
import { FieldInfo } from './FieldInfo'
import type { TariffWindow } from '@/lib/tariff-api'

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

interface Props {
  windows: TariffWindow[]
  onChange: (windows: TariffWindow[]) => void
}

// WHY: mirrors the API validator (schedule-validation.ts). A day is valid only
// when its windows tile [0,1440) exactly — contiguous from 0, no gap, no overlap.
// Overlap (start < cursor) is rejected just like a gap (start > cursor).
function dayIsCovered(windows: TariffWindow[], bit: number): boolean {
  const segments: Array<[number, number]> = []
  for (const w of windows) {
    if ((w.dayMask & bit) === 0) continue
    if (w.endMinute > w.startMinute) {
      segments.push([w.startMinute, w.endMinute])
    } else {
      segments.push([w.startMinute, 1440])
      if (w.endMinute > 0) segments.push([0, w.endMinute])
    }
  }
  if (segments.length === 0) return false
  segments.sort((a, b) => a[0] - b[0])
  let cursor = 0
  for (const [start, end] of segments) {
    if (start !== cursor) return false
    cursor = end
  }
  return cursor === 1440
}

export function WindowsEditor({ windows, onChange }: Props) {
  const t = useTranslations('tariffs')

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
      {
        key: makeKey(),
        label: t('new.defaultWindowLabel'),
        dayMask: ALL_DAYS_MASK,
        startMinute: 0,
        endMinute: 1440,
      },
    ])
  }

  function removeWindow(index: number) {
    onChange(windows.filter((_, i) => i !== index))
  }

  const uncoveredDays = WEEKDAY_LABELS.map((_, i) => i)
    .filter((i) => {
      const bit = DAY_BITS[i] ?? 0
      const usedByAny = windows.some((w) => (w.dayMask & bit) !== 0)
      return usedByAny && !dayIsCovered(windows, bit)
    })
    .map((i) => t(`windows.weekday.${WEEKDAY_KEYS[i]}`))

  return (
    <section className="editor-section card">
      <div className="editor-section__head">
        <h3 className="h-heading">{t('windows.heading')}</h3>
        <p className="text-secondary editor-section__hint">{t('windows.hint')}</p>
      </div>

      <div className="editor-rows">
        {windows.map((win, i) => (
          <div key={win.key} className="editor-row windows-row">
            <label className="field windows-row__label">
              <span className="field__label">
                {t('windows.label')}
                <FieldInfo text={t('windows.info.label')} />
              </span>
              <input
                className="input"
                type="text"
                value={win.label}
                onChange={(e) => update(i, { label: e.target.value })}
              />
            </label>

            <div className="field">
              <span className="field__label">
                {t('windows.days')}
                <FieldInfo text={t('windows.info.days')} />
              </span>
              <div className="weekday-chips">
                {WEEKDAY_KEYS.map((dayKey, di) => {
                  const bit = DAY_BITS[di] ?? 0
                  const active = (win.dayMask & bit) === bit
                  return (
                    <button
                      key={dayKey}
                      type="button"
                      className={`weekday-chip${active ? ' weekday-chip--active' : ''}`}
                      onClick={() => toggleDay(i, bit)}
                      aria-pressed={active}
                    >
                      {t(`windows.weekday.${dayKey}`)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="field windows-row__time">
              <span className="field__label">
                {t('windows.start')}
                <FieldInfo text={t('windows.info.start')} />
              </span>
              <DateTimePicker
                mode="time"
                value={minutesToHHMM(win.startMinute)}
                onChange={(v) => update(i, { startMinute: hhmmToMinutes(v) })}
                ariaLabel={t('windows.startAria')}
              />
            </div>

            <div className="field windows-row__time">
              <span className="field__label">
                {t('windows.end')}
                <FieldInfo text={t('windows.info.end')} />
              </span>
              <DateTimePicker
                mode="time"
                value={minutesToHHMM(win.endMinute)}
                onChange={(v) => update(i, { endMinute: hhmmToMinutes(v) })}
                ariaLabel={t('windows.endAria')}
              />
            </div>

            <button
              type="button"
              className="btn btn--icon btn--ghost-danger"
              onClick={() => removeWindow(i)}
              disabled={windows.length <= 1}
              aria-label={t('windows.removeWindow')}
              data-tooltip={t('windows.removeWindow')}
              data-tooltip-pos="bottom"
            >
              <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      {uncoveredDays.length > 0 ? (
        <p className="editor-warning" role="status">
          {t('windows.uncoveredWarning', { days: uncoveredDays.join(', ') })}
        </p>
      ) : null}

      <button type="button" className="row-btn row-btn--add" onClick={addWindow}>
        {t('windows.addWindow')}
      </button>
    </section>
  )
}
