'use client'

import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UNIT_OPTIONS, makeKey } from '@/lib/tariff-schema'
import { FieldInfo } from './FieldInfo'
import type { TariffTier } from '@/lib/tariff-api'

interface Props {
  tiers: TariffTier[]
  onChange: (tiers: TariffTier[]) => void
}

// WHY: tiers tile [0,∞) contiguously, so each tier's fromMinute is the previous
// tier's toMinute. We always re-derive fromMinute from the chain on every edit
// and keep exactly one open-ended (toMinute=null) tier as the last entry.
function normalize(tiers: TariffTier[]): TariffTier[] {
  let cursor = 0
  return tiers.map((tier, i) => {
    const isLast = i === tiers.length - 1
    const toMinute = isLast ? null : (tier.toMinute ?? cursor + 60)
    const next: TariffTier = { ...tier, fromMinute: cursor, toMinute }
    if (toMinute !== null) cursor = toMinute
    return next
  })
}

export function TiersEditor({ tiers, onChange }: Props) {
  const t = useTranslations('tariffs')

  function update(index: number, patch: Partial<TariffTier>) {
    onChange(normalize(tiers.map((t, i) => (i === index ? { ...t, ...patch } : t))))
  }

  function addTier() {
    const last = tiers[tiers.length - 1]
    const splitAt = (last?.fromMinute ?? 0) + 60
    const updatedLast: TariffTier = last
      ? { ...last, toMinute: splitAt }
      : { key: makeKey(), fromMinute: 0, toMinute: splitAt, unit: 'per_block', blockMinutes: 60 }
    const newOpen: TariffTier = {
      key: makeKey(),
      fromMinute: splitAt,
      toMinute: null,
      unit: 'per_block',
      blockMinutes: 60,
    }
    const head = tiers.slice(0, -1)
    onChange(normalize([...head, updatedLast, newOpen]))
  }

  function removeTier(index: number) {
    if (tiers.length <= 1) return
    onChange(normalize(tiers.filter((_, i) => i !== index)))
  }

  return (
    <section className="editor-section card">
      <div className="editor-section__head">
        <h3 className="h-heading">{t('tiers.heading')}</h3>
        <p className="text-secondary editor-section__hint">{t('tiers.hint')}</p>
      </div>

      <div className="editor-rows">
        {tiers.map((tier, i) => {
          const isLast = i === tiers.length - 1
          return (
            <div key={tier.key} className="editor-row tiers-row">
              <label className="field tiers-row__cell">
                <span className="field__label">
                  {t('tiers.fromMinutes')}
                  <FieldInfo text={t('tiers.info.fromMinutes')} />
                </span>
                <input className="input" type="number" value={tier.fromMinute} readOnly disabled />
              </label>

              <label className="field tiers-row__cell">
                <span className="field__label">
                  {t('tiers.toMinutes')}
                  <FieldInfo text={t('tiers.info.toMinutes')} />
                </span>
                {isLast ? (
                  <input
                    className="input"
                    type="text"
                    value={t('tiers.openEnded')}
                    readOnly
                    disabled
                  />
                ) : (
                  <input
                    className="input"
                    type="number"
                    min={tier.fromMinute + 1}
                    value={tier.toMinute ?? ''}
                    onChange={(e) => update(i, { toMinute: Number(e.target.value) })}
                  />
                )}
              </label>

              <label className="field tiers-row__cell">
                <span className="field__label">
                  {t('tiers.unit')}
                  <FieldInfo text={t('tiers.info.unit')} />
                </span>
                <select
                  className="input"
                  value={tier.unit}
                  onChange={(e) => {
                    const unit = e.target.value as TariffTier['unit']
                    update(i, {
                      unit,
                      blockMinutes: unit === 'per_block' ? (tier.blockMinutes ?? 60) : null,
                    })
                  }}
                >
                  {UNIT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {t(o.labelKey)}
                    </option>
                  ))}
                </select>
              </label>

              {tier.unit === 'per_block' ? (
                <label className="field tiers-row__cell">
                  <span className="field__label">
                    {t('tiers.blockMinutes')}
                    <FieldInfo text={t('tiers.info.blockMinutes')} />
                  </span>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={tier.blockMinutes ?? ''}
                    onChange={(e) => update(i, { blockMinutes: Number(e.target.value) })}
                  />
                </label>
              ) : null}

              <button
                type="button"
                className="btn btn--icon btn--ghost-danger"
                onClick={() => removeTier(i)}
                disabled={tiers.length <= 1}
                aria-label={t('tiers.removeTier')}
                data-tooltip={t('tiers.removeTier')}
                data-tooltip-pos="bottom"
              >
                <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>

      <button type="button" className="row-btn row-btn--add" onClick={addTier}>
        {t('tiers.addTier')}
      </button>
    </section>
  )
}
