'use client'

import { useCallback, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  type MapCameraChangedEvent,
} from '@vis.gl/react-google-maps'
import { Power, PowerOff, Rocket, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Spinner } from './Spinner'
import { bulkFacilityAction, fetchMapFacilitiesAction } from '@/lib/facility-actions'
import { KIND_META } from '@/lib/facility-display'
import { useDebouncedCallback } from '@/lib/use-debounced-callback'
import type { AdminMapPoint, AdminMapResponse, BulkFacilityAction, FacilityKind } from '@/lib/api'

const GREECE = { lat: 38.5, lng: 24.0 }

interface Filters {
  q?: string
  isActive?: boolean
  isVerified?: boolean
  kind?: FacilityKind
}

interface Props {
  filters: Filters
}

function pinClass(point: AdminMapPoint): string {
  if (point.isActive && point.isVerified) return 'map-pin--live'
  if (point.isActive) return 'map-pin--active'
  return 'map-pin--inactive'
}

export function FacilityMapView({ filters }: Props) {
  const t = useTranslations('facilities')
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

  const [data, setData] = useState<AdminMapResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<AdminMapPoint | null>(null)
  const [pending, startTransition] = useTransition()

  const load = useCallback(
    async (bounds: { north: number; south: number; east: number; west: number }) => {
      setLoading(true)
      const res = await fetchMapFacilitiesAction({ ...bounds, ...filters })
      setLoading(false)
      if (res.ok) setData(res.data)
    },
    [filters],
  )

  const debouncedLoad = useDebouncedCallback(load, 400)

  const onCamera = (event: MapCameraChangedEvent) => {
    const b = event.detail.bounds
    if (b) debouncedLoad({ north: b.north, south: b.south, east: b.east, west: b.west })
  }

  const act = (action: BulkFacilityAction, point: AdminMapPoint) => {
    startTransition(async () => {
      const res = await bulkFacilityAction(action, [point.id])
      if (!res.ok) return
      setSelected(null)
      setData((prev) => {
        if (!prev) return prev
        const patch = (p: AdminMapPoint): AdminMapPoint =>
          p.id !== point.id
            ? p
            : action === 'deploy'
              ? { ...p, isActive: true, isVerified: true }
              : action === 'enable'
                ? { ...p, isActive: true }
                : { ...p, isActive: false }
        return { ...prev, points: prev.points.map(patch) }
      })
    })
  }

  if (!apiKey) {
    return (
      <p className="facility-map__fallback">
        {t.rich('map.unavailable', { code: (chunks) => <code>{chunks}</code> })}
      </p>
    )
  }

  return (
    <div className="map-view">
      <APIProvider apiKey={apiKey}>
        <Map
          className="map-view__canvas"
          mapId={mapId}
          defaultCenter={GREECE}
          defaultZoom={6}
          gestureHandling="greedy"
          clickableIcons={false}
          onCameraChanged={onCamera}
        >
          {data?.mode === 'points'
            ? data.points.map((p) => (
                <AdvancedMarker
                  key={p.id}
                  position={{ lat: p.lat, lng: p.lng }}
                  onClick={() => setSelected(p)}
                >
                  <span className={`map-pin ${pinClass(p)}`} aria-label={p.name} />
                </AdvancedMarker>
              ))
            : null}
          {data?.mode === 'clusters'
            ? data.clusters.map((c) => (
                <AdvancedMarker key={c.id} position={{ lat: c.lat, lng: c.lng }}>
                  <span className="map-cluster">{c.count}</span>
                </AdvancedMarker>
              ))
            : null}
        </Map>
      </APIProvider>

      <div className="map-view__legend">
        <span className="map-legend__item">
          <span className="map-pin map-pin--live" /> {t('status.live')}
        </span>
        <span className="map-legend__item">
          <span className="map-pin map-pin--active" /> {t('status.active')}
        </span>
        <span className="map-legend__item">
          <span className="map-pin map-pin--inactive" /> {t('status.inactive')}
        </span>
      </div>

      <div className="map-view__status">
        {loading ? (
          <>
            <Spinner size={14} /> {t('map.loading')}
          </>
        ) : data ? (
          data.mode === 'clusters' ? (
            t('map.zoomToAct', { count: data.total })
          ) : (
            t('map.shown', { count: data.points.length })
          )
        ) : (
          t('map.panOrZoom')
        )}
      </div>

      {selected ? (
        <div className="map-popup" role="dialog" aria-label={selected.name}>
          <button
            type="button"
            className="map-popup__close"
            aria-label={t('map.close')}
            onClick={() => setSelected(null)}
          >
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <span className={`badge ${KIND_META[selected.kind].badge}`}>
            {KIND_META[selected.kind].label}
          </span>
          <h3 className="map-popup__title">{selected.name}</h3>
          <p className="map-popup__meta text-secondary">
            {selected.isActive ? t('status.active') : t('status.inactive')} ·{' '}
            {selected.isVerified ? t('status.verified') : t('status.pending')}
          </p>
          <div className="map-popup__actions">
            {!(selected.isActive && selected.isVerified) ? (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                disabled={pending}
                onClick={() => act('deploy', selected)}
              >
                <Rocket size={15} strokeWidth={2} aria-hidden="true" />
                {t('actions.deploy')}
              </button>
            ) : null}
            {selected.isActive ? (
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                disabled={pending}
                onClick={() => act('disable', selected)}
              >
                <PowerOff size={15} strokeWidth={2} aria-hidden="true" />
                {t('actions.disable')}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                disabled={pending}
                onClick={() => act('enable', selected)}
              >
                <Power size={15} strokeWidth={2} aria-hidden="true" />
                {t('actions.enable')}
              </button>
            )}
            <Link href={`/dashboard/facilities/${selected.id}`} className="btn btn--secondary btn--sm">
              {t('actions.edit')}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
