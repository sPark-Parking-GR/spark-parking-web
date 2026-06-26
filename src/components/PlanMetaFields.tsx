'use client'

import { VEHICLE_TYPE_OPTIONS } from '@/lib/tariff-schema'
import { MultiSelectControl } from './MultiSelectControl'
import { VEHICLE_ICON } from './vehicle-icons'
import { DateTimePicker } from './pickers/DateTimePicker'
import type { TariffDraft } from '@/lib/tariff-api'
import type { VehicleType } from '@spark/types'

const VEHICLE_OPTIONS = VEHICLE_TYPE_OPTIONS.map((o) => ({ ...o, icon: VEHICLE_ICON[o.value] }))

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
  return (
    <section className="editor-section card">
      <div className="editor-section__head">
        <h3 className="h-heading">Plan details</h3>
      </div>

      <label className="field">
        <span className="field__label">Plan name</span>
        <input
          className="input"
          type="text"
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </label>

      <div className="field-grid">
        <label className="field">
          <span className="field__label">Timezone (IANA)</span>
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
        <label className="field">
          <span className="field__label">Grace minutes</span>
          <input
            className="input"
            type="number"
            min={0}
            value={draft.graceMinutes}
            onChange={(e) => onChange({ graceMinutes: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span className="field__label">Increment minutes</span>
          <input
            className="input"
            type="number"
            min={1}
            value={draft.incrementMinutes}
            onChange={(e) => onChange({ incrementMinutes: Number(e.target.value) })}
          />
        </label>
      </div>

      <div className="field-grid">
        <div className="field">
          <span className="field__label">Valid from</span>
          <DateTimePicker
            mode="datetime"
            value={isoToLocalInput(draft.validFrom)}
            onChange={(v) => onChange({ validFrom: localInputToIso(v) })}
            placeholder="Any time"
            ariaLabel="Valid from"
          />
        </div>
        <div className="field">
          <span className="field__label">Valid to</span>
          <DateTimePicker
            mode="datetime"
            value={isoToLocalInput(draft.validTo)}
            onChange={(v) => onChange({ validTo: localInputToIso(v) })}
            placeholder="Any time"
            ariaLabel="Valid to"
          />
        </div>
      </div>

      <div className="field">
        <span className="field__label">Vehicle types</span>
        <MultiSelectControl
          options={VEHICLE_OPTIONS}
          value={draft.vehicleTypes}
          onChange={(vehicleTypes) => onChange({ vehicleTypes: vehicleTypes as VehicleType[] })}
        />
      </div>

      <div className="field checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={draft.isDefault}
            onChange={(e) => onChange({ isDefault: e.target.checked })}
          />
          Default plan
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(e) => onChange({ isActive: e.target.checked })}
          />
          Active
        </label>
      </div>
    </section>
  )
}
