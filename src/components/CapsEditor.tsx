'use client'

import { useState } from 'react'
import { CAP_SCOPE_OPTIONS, formatCents, eurosToCents, makeKey } from '@/lib/tariff-schema'
import type { TariffCap } from '@/lib/tariff-api'

interface Props {
  caps: TariffCap[]
  onChange: (caps: TariffCap[]) => void
}

export function CapsEditor({ caps, onChange }: Props) {
  // Caps carry no identity field; track stable React keys alongside the rows so a
  // removal in the middle doesn't make controlled inputs shift onto the wrong row.
  const [rowIds, setRowIds] = useState<string[]>(() => caps.map(() => makeKey()))

  function update(index: number, patch: Partial<TariffCap>) {
    onChange(caps.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function addCap() {
    setRowIds((ids) => [...ids, makeKey()])
    onChange([...caps, { windowMinutes: 1440, capCents: 0, scope: 'stay' }])
  }

  function removeCap(index: number) {
    setRowIds((ids) => ids.filter((_, i) => i !== index))
    onChange(caps.filter((_, i) => i !== index))
  }

  return (
    <section className="editor-section card">
      <div className="editor-section__head">
        <h3 className="h-heading">Caps (optional)</h3>
        <p className="text-secondary editor-section__hint">
          Clamp totals. Stay = whole stay; rolling = per window bucket (1440 = daily).
        </p>
      </div>

      <div className="editor-rows">
        {caps.map((cap, i) => (
          <div key={rowIds[i]} className="editor-row caps-row">
            <label className="field caps-row__cell">
              <span className="field__label">Window (min)</span>
              <input
                className="input"
                type="number"
                min={1}
                value={cap.windowMinutes}
                onChange={(e) => update(i, { windowMinutes: Number(e.target.value) })}
              />
            </label>

            <label className="field caps-row__cell">
              <span className="field__label">Cap (€)</span>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                value={formatCents(cap.capCents)}
                onChange={(e) => update(i, { capCents: eurosToCents(e.target.value) })}
              />
            </label>

            <label className="field caps-row__cell">
              <span className="field__label">Scope</span>
              <select
                className="input"
                value={cap.scope}
                onChange={(e) => update(i, { scope: e.target.value as TariffCap['scope'] })}
              >
                {CAP_SCOPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="row-btn row-btn--remove"
              onClick={() => removeCap(i)}
              aria-label="Remove cap"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="row-btn row-btn--add" onClick={addCap}>
        + Add cap
      </button>
    </section>
  )
}
