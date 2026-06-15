'use client'

import { useEffect, useState } from 'react'
import { CITY_PRESETS, VEHICLE_TYPES } from '../lib/constants'
import { inputClass } from './ui'

export interface AppliedQuery {
  lat: number
  lng: number
  startsAt: string
  endsAt: string
  vehicleType: string
}

function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function SearchPanel({ onSearch }: { onSearch: (query: AppliedQuery) => void }) {
  const [presetIndex, setPresetIndex] = useState(0)
  const [vehicleType, setVehicleType] = useState('CAR')
  const [startStr, setStartStr] = useState('')
  const [endStr, setEndStr] = useState('')

  useEffect(() => {
    const start = new Date(Date.now() + 60 * 60_000)
    start.setMinutes(0, 0, 0)
    const end = new Date(start.getTime() + 3 * 60 * 60_000)
    setStartStr(toLocalInput(start))
    setEndStr(toLocalInput(end))

    const preset = CITY_PRESETS[0]!
    onSearch({
      lat: preset.lat,
      lng: preset.lng,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      vehicleType: 'CAR',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function submit() {
    const preset = CITY_PRESETS[presetIndex]
    if (!preset || !startStr || !endStr) return
    onSearch({
      lat: preset.lat,
      lng: preset.lng,
      startsAt: new Date(startStr).toISOString(),
      endsAt: new Date(endStr).toISOString(),
      vehicleType,
    })
  }

  return (
    <div className="search-card">
      <div className="search-card__head">
        <span className="brand">Parqin</span>
        <span className="brand__tag">Make Parking Smart</span>
      </div>

      <div className="search-fields">
        <select
          className={`${inputClass} f-dest`}
          value={presetIndex}
          onChange={(e) => setPresetIndex(Number(e.target.value))}
        >
          {CITY_PRESETS.map((preset, index) => (
            <option key={preset.label} value={index}>
              {preset.label}
            </option>
          ))}
        </select>
        <input
          className={`${inputClass} f-time`}
          type="datetime-local"
          value={startStr}
          onChange={(e) => setStartStr(e.target.value)}
        />
        <input
          className={`${inputClass} f-time`}
          type="datetime-local"
          value={endStr}
          onChange={(e) => setEndStr(e.target.value)}
        />
        <select
          className={`${inputClass} f-veh`}
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
        >
          {VEHICLE_TYPES.map((vt) => (
            <option key={vt.value} value={vt.value}>
              {vt.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={submit} className="btn btn--primary f-go">
          Αναζήτηση
        </button>
      </div>
    </div>
  )
}
