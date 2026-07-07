'use client'

import { useTranslations } from 'next-intl'
import { Switch, Stepper } from '@spark/ui'
import { VEHICLE_TYPE_OPTIONS } from '@/lib/tariff-schema'
import { MultiSelectControl } from './MultiSelectControl'
import { VEHICLE_ICON } from './vehicle-icons'
import { DateTimePicker } from './pickers/DateTimePicker'
import type { TariffDraft } from '@/lib/tariff-api'
import type { VehicleType } from '@spark/types'

interface Props {
  draft: TariffDraft
  onChange: (patch: Partial<TariffDraft>) => void
}

// WHY: datetime-local inputs want 'YYYY-MM-DDTHH:MM'; the draft stores full ISO
// (or null), so trim/expand at the boundary only.
function isoToLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localInputToIso(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export function PlanMetaFields({ draft, onChange }: Props) {
  const t = useTranslations('tariffs')
  const vehicleOptions = VEHICLE_TYPE_OPTIONS.map((o) => ({
    value: o.value,
    label: t(`vehicleTypes.${o.value}`),
    icon: VEHICLE_ICON[o.value],
  }))

  return (
    <section className="editor-section card">
      <div className="editor-section__head">
        <h3 className="h-heading">{t('meta.heading')}</h3>
      </div>

      <label className="field">
        <span className="field__label">{t('meta.planName')}</span>
        <input
          className="input"
          type="text"
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </label>

      <div className="field-grid">
        <label className="field">
          <span className="field__label">{t('meta.timezone')}</span>
          <input
            className="input"
            type="text"
            value={draft.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
          />
        </label>
        <div className="field" />
      </div>

      <div className="field-grid">
        <div className="field">
          <span className="field__label">{t('meta.graceMinutes')}</span>
          <Stepper
            value={draft.graceMinutes}
            onChange={(graceMinutes) => onChange({ graceMinutes })}
            step={5}
            min={0}
            size="sm"
          />
        </div>
        <div className="field">
          <span className="field__label">{t('meta.incrementMinutes')}</span>
          <Stepper
            value={draft.incrementMinutes}
            onChange={(incrementMinutes) => onChange({ incrementMinutes })}
            step={5}
            min={1}
            size="sm"
          />
        </div>
      </div>

      <div className="field-grid">
        <div className="field">
          <span className="field__label">{t('meta.validFrom')}</span>
          <DateTimePicker
            mode="datetime"
            value={isoToLocalInput(draft.validFrom)}
            onChange={(v) => onChange({ validFrom: localInputToIso(v) })}
            placeholder={t('meta.anyTime')}
            ariaLabel={t('meta.validFrom')}
          />
        </div>
        <div className="field">
          <span className="field__label">{t('meta.validTo')}</span>
          <DateTimePicker
            mode="datetime"
            value={isoToLocalInput(draft.validTo)}
            onChange={(v) => onChange({ validTo: localInputToIso(v) })}
            placeholder={t('meta.anyTime')}
            ariaLabel={t('meta.validTo')}
          />
        </div>
      </div>

      <div className="field">
        <span className="field__label">{t('meta.vehicleTypesLabel')}</span>
        <MultiSelectControl
          options={vehicleOptions}
          value={draft.vehicleTypes}
          onChange={(vehicleTypes) => onChange({ vehicleTypes: vehicleTypes as VehicleType[] })}
        />
      </div>

      <div className="field checkbox-group">
        <label className="checkbox-label">
          <Switch checked={draft.isActive} onChange={(isActive) => onChange({ isActive })} />
          {t('meta.active')}
        </label>
        <label className="checkbox-label">
          <Switch
            checked={draft.isDefault}
            disabled={draft.vehicleTypes.length > 0}
            onChange={(isDefault) => onChange({ isDefault })}
          />
          {t('meta.defaultPlan')}
        </label>
        {draft.vehicleTypes.length > 0 ? (
          <p className="text-secondary editor-section__hint">{t('meta.defaultHint')}</p>
        ) : null}
      </div>
    </section>
  )
}
