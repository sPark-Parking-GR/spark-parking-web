'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Stepper } from '@spark/ui'
import { CAP_SCOPE_OPTIONS, makeKey } from '@/lib/tariff-schema'
import { FieldInfo } from './FieldInfo'
import type { TariffCap } from '@/lib/tariff-api'

interface Props {
  caps: TariffCap[]
  onChange: (caps: TariffCap[]) => void
}

export function CapsEditor({ caps, onChange }: Props) {
  const t = useTranslations('tariffs')
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
        <h3 className="h-heading">{t('caps.heading')}</h3>
        <p className="text-secondary editor-section__hint">{t('caps.hint')}</p>
      </div>

      <div className="editor-rows">
        {caps.map((cap, i) => (
          <div key={rowIds[i]} className="editor-row caps-row">
            <label className="field caps-row__cell">
              <span className="field__label">
                {t('caps.windowMinutes')}
                <FieldInfo text={t('caps.info.windowMinutes')} />
              </span>
              <input
                className="input"
                type="number"
                min={1}
                value={cap.windowMinutes}
                onChange={(e) => update(i, { windowMinutes: Number(e.target.value) })}
              />
            </label>

            <div className="field caps-row__cell">
              <span className="field__label">
                {t('caps.cap')}
                <FieldInfo text={t('caps.info.cap')} />
              </span>
              <Stepper
                value={cap.capCents}
                onChange={(capCents) => update(i, { capCents })}
                step={5}
                min={0}
                formatValue={(cents) => `€${(cents / 100).toFixed(2)}`}
                size="sm"
              />
            </div>

            <label className="field caps-row__cell">
              <span className="field__label">
                {t('caps.scope')}
                <FieldInfo text={t('caps.info.scope')} />
              </span>
              <select
                className="input"
                value={cap.scope}
                onChange={(e) => update(i, { scope: e.target.value as TariffCap['scope'] })}
              >
                {CAP_SCOPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="btn btn--icon btn--ghost-danger"
              onClick={() => removeCap(i)}
              aria-label={t('caps.removeCap')}
              data-tooltip={t('caps.removeCap')}
              data-tooltip-pos="bottom"
            >
              <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="row-btn row-btn--add" onClick={addCap}>
        {t('caps.addCap')}
      </button>
    </section>
  )
}
