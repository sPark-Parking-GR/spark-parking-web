'use client'

import { useTranslations } from 'next-intl'
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

export function RateGrid({
  tiers,
  windows,
  rates,
  currency,
  onChangeRate,
  onChangeCurrency,
}: Props) {
  const t = useTranslations('tariffs')
  const byCell = new Map(rates.map((r) => [`${r.tierKey}::${r.windowKey}`, r]))

  function tierLabel(tier: TariffTier, index: number): string {
    const to = tier.toMinute === null ? '∞' : `${tier.toMinute}`
    return t('rateGrid.tierLabel', { index: index + 1, from: tier.fromMinute, to })
  }

  return (
    <section className="editor-section card">
      <div className="editor-section__head">
        <h3 className="h-heading">{t('rateGrid.heading')}</h3>
        <p className="text-secondary editor-section__hint">{t('rateGrid.hint')}</p>
      </div>

      <label className="field rate-grid__currency">
        <span className="field__label">{t('rateGrid.currency')}</span>
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
              <th>{t('rateGrid.tierWindowHeader')}</th>
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
