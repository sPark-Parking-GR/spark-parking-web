'use client'

import { useEffect, useRef, useState } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMapsLibrary,
  type MapCameraChangedEvent,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps'
import { LocateFixed } from 'lucide-react'
import type { LocationPickerProps } from '@/components/FacilityLocationPicker'

const ATHENS = { lat: 37.9838, lng: 23.7275 }
const GEOCODE_DEBOUNCE_MS = 700

function locateErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Location access denied. Allow location access for this site in your browser settings and try again.'
    case err.TIMEOUT:
      return 'Could not get your location in time. Try again.'
    default:
      return 'Could not determine your location.'
  }
}

function LocateMeButton({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    if (!navigator.geolocation) {
      setError('Your browser does not support location.')
      return
    }
    setError(null)
    setPending(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPending(false)
        onLocate(position.coords.latitude, position.coords.longitude)
      },
      (err) => {
        setPending(false)
        setError(locateErrorMessage(err))
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  return (
    <div className="facility-map__locate-wrap">
      <button
        type="button"
        className="facility-map__locate-btn"
        onClick={handleClick}
        disabled={pending}
        aria-label="Use my current location"
        data-tooltip="Use my current location"
        data-tooltip-pos="left"
      >
        <LocateFixed size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      {error ? (
        <p className="facility-map__locate-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

interface MapInnerProps {
  lat: number | null
  lng: number | null
  address?: string
  mapId: string
  onChange?: (lat: number, lng: number) => void
  onAddressChange?: (address: string) => void
  readOnly?: boolean
}

// Rendered inside APIProvider so it can load the geocoding library alongside the map —
// owns the one Geocoder instance and every handler that needs it (click, drag, locate-me,
// address->pin sync), rather than splitting that state across sibling components.
function MapInner({ lat, lng, address, mapId, onChange, onAddressChange, readOnly }: MapInnerProps) {
  const hasPosition = lat !== null && lng !== null
  const position = hasPosition ? { lat, lng } : null

  const [camera, setCamera] = useState({
    center: position ?? ATHENS,
    zoom: hasPosition ? 15 : 11,
  })

  useEffect(() => {
    if (lat !== null && lng !== null) {
      setCamera((prev) => ({ ...prev, center: { lat, lng }, zoom: Math.max(prev.zoom, 15) }))
    }
  }, [lat, lng])

  const geocodingLib = useMapsLibrary('geocoding')
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  // Last address WE produced via reverse geocoding, so the forward-geocode effect below
  // doesn't immediately re-geocode its own echo and fight the pin the user just placed.
  const lastResolvedAddress = useRef<string | null>(null)

  useEffect(() => {
    if (geocodingLib) geocoderRef.current = new geocodingLib.Geocoder()
  }, [geocodingLib])

  // Forward geocode: address -> pin, debounced so it fires once typing settles.
  useEffect(() => {
    if (!address || !address.trim() || !geocoderRef.current) return
    if (address === lastResolvedAddress.current) return

    const handle = setTimeout(() => {
      geocoderRef.current!.geocode({ address }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location
          onChange?.(loc.lat(), loc.lng())
        }
      })
    }, GEOCODE_DEBOUNCE_MS)

    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  const reverseGeocode = (nextLat: number, nextLng: number) => {
    if (!geocoderRef.current || !onAddressChange) return
    geocoderRef.current.geocode({ location: { lat: nextLat, lng: nextLng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        lastResolvedAddress.current = results[0].formatted_address
        onAddressChange(results[0].formatted_address)
      }
    })
  }

  const handleClick = (event: MapMouseEvent) => {
    const point = event.detail.latLng
    if (!point) return
    onChange?.(point.lat, point.lng)
    reverseGeocode(point.lat, point.lng)
  }

  const handleDragEnd = (event: google.maps.MapMouseEvent) => {
    const point = event.latLng
    if (!point) return
    onChange?.(point.lat(), point.lng())
    reverseGeocode(point.lat(), point.lng())
  }

  const handleLocate = (nextLat: number, nextLng: number) => {
    onChange?.(nextLat, nextLng)
    reverseGeocode(nextLat, nextLng)
  }

  return (
    <div className="facility-map__wrap">
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
      {readOnly ? null : <LocateMeButton onLocate={handleLocate} />}
    </div>
  )
}

export function GoogleLocationPicker(props: LocationPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

  if (!apiKey) {
    return (
      <p className="facility-map__fallback">
        Map unavailable — set <code>NEXT_PUBLIC_GOOGLE_MAPS_KEY</code>.
      </p>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <MapInner {...props} mapId={mapId} />
    </APIProvider>
  )
}
