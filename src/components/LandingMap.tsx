'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { searchFacilities, type FacilitySearchResult } from '../lib/api'
import { CITY_PRESETS } from '../lib/constants'
import { BottomSheet } from './BottomSheet'
import { SearchPanel, type AppliedQuery } from './SearchPanel'

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-secondary)',
      }}
    >
      Φόρτωση χάρτη…
    </div>
  ),
})

export function LandingMap() {
  const [applied, setApplied] = useState<AppliedQuery | null>(null)
  const [results, setResults] = useState<FacilitySearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!applied) return
    let cancelled = false
    setLoading(true)
    setError(null)
    searchFacilities({
      lat: applied.lat,
      lng: applied.lng,
      radiusMeters: 5000,
      startsAt: applied.startsAt,
      endsAt: applied.endsAt,
      vehicleType: applied.vehicleType,
    })
      .then((data) => {
        if (!cancelled) setResults(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Η αναζήτηση απέτυχε')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [applied])

  const detailQuery = useMemo(() => {
    if (!applied) return ''
    return new URLSearchParams({
      startsAt: applied.startsAt,
      endsAt: applied.endsAt,
      vehicleType: applied.vehicleType,
    }).toString()
  }, [applied])

  const center = applied
    ? { lat: applied.lat, lng: applied.lng }
    : { lat: CITY_PRESETS[0]!.lat, lng: CITY_PRESETS[0]!.lng }

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapView center={center} results={results} detailQuery={detailQuery} />
      </div>

      <div className="overlay overlay-top">
        <SearchPanel onSearch={setApplied} />
      </div>

      <div className="overlay overlay-bottom">
        <BottomSheet results={results} detailQuery={detailQuery} loading={loading} error={error} />
      </div>
    </div>
  )
}
