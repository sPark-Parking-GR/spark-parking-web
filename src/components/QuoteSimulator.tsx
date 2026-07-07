'use client'

import { useTranslations } from 'next-intl'
import { formatCents } from '@/lib/tariff-schema'
import { DateTimePicker } from '@/components/pickers/DateTimePicker'
import { Badge } from '@spark/ui'
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

export function QuoteSimulator({
  startsAt,
  endsAt,
  vehicleType,
  vehicleTypes,
  result,
  pending,
  onChange,
}: Props) {
  const t = useTranslations('tariffs')
  const options = vehicleTypes.length > 0 ? vehicleTypes : (['car'] as VehicleType[])

  return (
    <aside className="simulator">
      <div className="simulator__head">
        <h3 className="h-heading">{t('simulator.heading')}</h3>
        {pending ? <Badge variant="neutral">{t('simulator.updating')}</Badge> : null}
      </div>

      <div className="simulator__dates">
        <div className="field">
          <span className="field__label">{t('simulator.startsAt')}</span>
          <DateTimePicker
            mode="datetime"
            value={startsAt}
            onChange={(v) => onChange({ startsAt: v })}
            ariaLabel={t('simulator.startAria')}
          />
        </div>
        <div className="field">
          <span className="field__label">{t('simulator.endsAt')}</span>
          <DateTimePicker
            mode="datetime"
            value={endsAt}
            onChange={(v) => onChange({ endsAt: v })}
            ariaLabel={t('simulator.endAria')}
          />
        </div>
      </div>

      <label className="field">
        <span className="field__label">{t('simulator.vehicleType')}</span>
        <select
          className="input"
          value={vehicleType}
          onChange={(e) => onChange({ vehicleType: e.target.value as VehicleType })}
        >
          {options.map((v) => (
            <option key={v} value={v}>
              {t(`vehicleTypes.${v}`)}
            </option>
          ))}
        </select>
      </label>

      {result === null ? (
        <p className="text-secondary simulator__hint">{t('simulator.emptyHint')}</p>
      ) : result.ok ? (
        <div className="simulator__result">
          <table className="sim-table">
            <thead>
              <tr>
                <th>{t('simulator.itemHeader')}</th>
                <th>{t('simulator.durHeader')}</th>
                <th>{t('simulator.unitHeader')}</th>
                <th>{t('simulator.qtyHeader')}</th>
                <th>{t('simulator.subtotalHeader')}</th>
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
              <dt>{t('simulator.duration')}</dt>
              <dd>{result.quote.durationMinutes}m</dd>
            </div>
            <div>
              <dt>{t('simulator.billable')}</dt>
              <dd>{result.quote.billableMinutes}m</dd>
            </div>
            <div className="sim-summary__total">
              <dt>{t('simulator.total')}</dt>
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
