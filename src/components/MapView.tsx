'use client'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { FacilitySearchResult } from '../lib/api'
import { formatDistance, formatMoney } from '../lib/format'

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true })
  }, [lat, lng, map])
  return null
}

function priceIcon(result: FacilitySearchResult): L.DivIcon {
  const bg = result.available ? '#12A3A0' : '#9AA0A6'
  const label = result.priceCents != null ? formatMoney(result.priceCents, result.currency) : '—'
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};color:#fff;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 1px 5px rgba(0,0,0,.35);transform:translate(-50%,-100%)">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

export default function MapView({
  center,
  results,
  detailQuery,
}: {
  center: { lat: number; lng: number }
  results: FacilitySearchResult[]
  detailQuery: string
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={center.lat} lng={center.lng} />
      {results.map((result) => (
        <Marker key={result.id} position={[result.lat, result.lng]} icon={priceIcon(result)}>
          <Popup>
            <div style={{ minWidth: 160 }}>
              <strong style={{ fontSize: 14 }}>{result.name}</strong>
              <div style={{ fontSize: 12, color: '#6B727A', margin: '2px 0 6px' }}>
                {result.address}
              </div>
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                {result.available ? 'Διαθέσιμο' : 'Πλήρες'} · {formatDistance(result.distanceMeters)}
                {result.priceCents != null
                  ? ` · ${formatMoney(result.priceCents, result.currency)}`
                  : ''}
              </div>
              <a
                href={`/facility/${result.id}?${detailQuery}`}
                style={{ color: '#12A3A0', fontWeight: 600, fontSize: 13 }}
              >
                Λεπτομέρειες →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
