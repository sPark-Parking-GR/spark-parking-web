'use client'

import { formatCents, eurosToCents } from '@/lib/tariff-schema'
import type { TariffRate, TariffTier, TariffWindow } from '@/lib/tariff-api'

interface Props {
  tiers: TariffTier[]
  windows: TariffWindow[]
  rates: TariffRate[]
  currency: string
  onChangeRate: (tierKey: string, windowKey: string, priceCents: number) => void
  onChangeCurrency: (currency: string) => void
}

const CURRENCY_OPTIONS = ['EUR'] as const

function tierLabel(tier: TariffTier, index: number): string {
  const to = tier.toMinute === null ? '∞' : `${tier.toMinute}`
  return `T${index + 1} · ${tier.fromMinute}–${to}m`
}

export function RateGrid({
  tiers,
  windows,
  rates,
  currency,
  onChangeRate,
  onChangeCurrency,
}: Props) {
  const byCell = new Map(rates.map((r) => [`${r.tierKey}::${r.windowKey}`, r]))

  return (
    <section className="editor-section card">
      <div className="editor-section__head">
        <h3 className="h-heading">Rate grid</h3>
        <p className="text-secondary editor-section__hint">
          Every tier × window needs a price. Empty cells are flagged and rejected on save.
        </p>
      </div>

      <label className="field rate-grid__currency">
        <span className="field__label">Currency</span>
        <select className="input" value={currency} onChange={(e) => onChangeCurrency(e.target.value)}>
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <div className="rate-grid__wrap">
        <table className="rate-grid">
          <thead>
            <tr>
              <th>Tier \ Window</th>
              {windows.map((w) => (
                <th key={w.key}>{w.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, ti) => (
              <tr key={tier.key}>
                <th scope="row">{tierLabel(tier, ti)}</th>
                {windows.map((w) => {
                  const cell = byCell.get(`${tier.key}::${w.key}`)
                  const missing = cell === undefined
                  return (
                    <td
                      key={w.key}
                      className={`rate-grid__cell${missing ? ' rate-grid__cell--invalid' : ''}`}
                    >
                      <input
                        className="input rate-grid__input"
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={cell ? formatCents(cell.priceCents) : ''}
                        placeholder="—"
                        onChange={(e) => onChangeRate(tier.key, w.key, eurosToCents(e.target.value))}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
