'use client'

import { formatCents } from '@/lib/tariff-schema'
import type { SimulateResult } from '@/lib/tariff-api'
import type { VehicleType } from '@spark/types'

interface Props {
  startsAt: string
  endsAt: string
  vehicleType: VehicleType
  vehicleTypes: VehicleType[]
  result: SimulateResult | null
  pending: boolean
  onChange: (patch: { startsAt?: string; endsAt?: string; vehicleType?: VehicleType }) => void
}

const VEHICLE_LABELS: Record<VehicleType, string> = {
  car: 'Car',
  motorcycle: 'Motorcycle',
  van: 'Van',
  truck: 'Truck',
}

export function QuoteSimulator({
  startsAt,
  endsAt,
  vehicleType,
  vehicleTypes,
  result,
  pending,
  onChange,
}: Props) {
  const options = vehicleTypes.length > 0 ? vehicleTypes : (['car'] as VehicleType[])

  return (
    <aside className="simulator">
      <div className="simulator__head">
        <h3 className="h-heading">Live quote</h3>
        {pending ? <span className="simulator__pending">updating…</span> : null}
      </div>

      <div className="field-grid">
        <label className="field">
          <span className="field__label">Starts at</span>
          <input
            className="input"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => onChange({ startsAt: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field__label">Ends at</span>
          <input
            className="input"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => onChange({ endsAt: e.target.value })}
          />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Vehicle type</span>
        <select
          className="input"
          value={vehicleType}
          onChange={(e) => onChange({ vehicleType: e.target.value as VehicleType })}
        >
          {options.map((v) => (
            <option key={v} value={v}>
              {VEHICLE_LABELS[v]}
            </option>
          ))}
        </select>
      </label>

      {result === null ? (
        <p className="text-secondary simulator__hint">Adjust the plan to preview a quote.</p>
      ) : result.ok ? (
        <div className="simulator__result">
          <table className="sim-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Dur</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {result.quote.lineItems.map((li, i) => (
                <tr key={i}>
                  <td>{li.label}</td>
                  <td>{li.durationMinutes}m</td>
                  <td>€{formatCents(li.unitPriceCents)}</td>
                  <td>{li.quantity}</td>
                  <td>€{formatCents(li.subtotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="sim-summary">
            <div>
              <dt>Duration</dt>
              <dd>{result.quote.durationMinutes}m</dd>
            </div>
            <div>
              <dt>Billable</dt>
              <dd>{result.quote.billableMinutes}m</dd>
            </div>
            <div className="sim-summary__total">
              <dt>Total</dt>
              <dd>
                {result.quote.currency} €{formatCents(result.quote.totalCents)}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="simulator__warning" role="status">
          {result.error}
        </p>
      )}
    </aside>
  )
}
