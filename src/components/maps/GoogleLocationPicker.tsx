'use client'

import { useEffect, useState } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  type MapCameraChangedEvent,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps'
import type { LocationPickerProps } from '@/components/FacilityLocationPicker'

const ATHENS = { lat: 37.9838, lng: 23.7275 }

export function GoogleLocationPicker({ lat, lng, onChange, readOnly }: LocationPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

  const hasPosition = lat !== null && lng !== null
  const position = hasPosition ? { lat, lng } : null

  const [camera, setCamera] = useState({
    center: position ?? ATHENS,
    zoom: hasPosition ? 15 : 11,
  })

  useEffect(() => {
    if (lat !== null && lng !== null) {
      setCamera((prev) => ({ ...prev, center: { lat, lng } }))
    }
  }, [lat, lng])

  if (!apiKey) {
    return (
      <p className="facility-map__fallback">
        Map unavailable — set <code>NEXT_PUBLIC_GOOGLE_MAPS_KEY</code>.
      </p>
    )
  }

  const handleClick = (event: MapMouseEvent) => {
    const point = event.detail.latLng
    if (point) onChange?.(point.lat, point.lng)
  }

  const handleDragEnd = (event: google.maps.MapMouseEvent) => {
    const point = event.latLng
    if (point) onChange?.(point.lat(), point.lng())
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        className="facility-map__canvas"
        mapId={mapId}
        center={camera.center}
        zoom={camera.zoom}
        gestureHandling="greedy"
        clickableIcons={false}
        disableDefaultUI={readOnly}
        onCameraChanged={(event: MapCameraChangedEvent) =>
          setCamera({ center: event.detail.center, zoom: event.detail.zoom })
        }
        onClick={readOnly ? undefined : handleClick}
      >
        {position ? (
          <AdvancedMarker
            position={position}
            draggable={!readOnly}
            onDragEnd={readOnly ? undefined : handleDragEnd}
          />
        ) : null}
      </Map>
    </APIProvider>
  )
}
