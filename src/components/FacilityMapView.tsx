'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  type MapCameraChangedEvent,
} from '@vis.gl/react-google-maps'
import { Eye, EyeOff, Power, PowerOff, Rocket, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { isPlatformRole } from '@spark/types'
import type { UserRole } from '@spark/types'
import { Spinner } from './Spinner'
import { bulkFacilityAction, fetchMapFacilitiesAction } from '@/lib/facility-actions'
import { KIND_META } from '@/lib/facility-display'
import { useDebouncedCallback } from '@/lib/use-debounced-callback'
import type { AdminMapPoint, AdminMapResponse, BulkFacilityAction, FacilityKind } from '@/lib/api'

const GREECE = { lat: 38.5, lng: 24.0 }

interface Filters {
  q?: string
  isActive?: boolean
  isPublished?: boolean
  kind?: FacilityKind
}

interface Props {
  filters: Filters
  role: UserRole
}

// Zooms/pans exactly once, the first time real data arrives, to fit every facility
// currently in view — after that the user's own pan/zoom takes over untouched.
function AutoFitBounds({ positions }: { positions: { lat: number; lng: number }[] }) {
  const map = useMap()
  const hasFitted = useRef(false)

  useEffect(() => {
    if (hasFitted.current || !map || positions.length === 0) return
    hasFitted.current = true

    const only = positions.length === 1 ? positions[0] : undefined
    if (only) {
      map.setCenter(only)
      map.setZoom(15)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    positions.forEach((p) => bounds.extend(p))
    map.fitBounds(bounds, 48)
  }, [map, positions])

  return null
}

function pinClass(point: AdminMapPoint): string {
  if (point.isActive && point.isPublished) return 'map-pin--live'
  if (point.isActive) return 'map-pin--active'
  return 'map-pin--inactive'
}

export function FacilityMapView({ filters, role }: Props) {
  const t = useTranslations('facilities')
  const isPlatformTier = isPlatformRole(role)
  const canTogglePublish = isPlatformTier || role === 'operator_admin'
  // Rendered from both the operator list (/dashboard/facilities) and the platform-admin
  // one (/admin/facilities), so detail links stay on the surface the user is already on.
  const pathname = usePathname()
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
        const patch = (p: AdminMapPoint): AdminMapPoint => {
          if (p.id !== point.id) return p
          switch (action) {
            case 'deploy':
              return { ...p, isActive: true, isPublished: true }
            case 'enable':
              return { ...p, isActive: true }
            case 'disable':
              return { ...p, isActive: false }
            case 'publish':
              return { ...p, isPublished: true }
            case 'unpublish':
              return { ...p, isPublished: false }
            default:
              return p
          }
        }
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

  const fitPositions =
    data?.mode === 'points'
      ? data.points.map((p) => ({ lat: p.lat, lng: p.lng }))
      : data?.mode === 'clusters'
        ? data.clusters.map((c) => ({ lat: c.lat, lng: c.lng }))
        : []

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
          <AutoFitBounds positions={fitPositions} />
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
            {t(KIND_META[selected.kind].labelKey)}
          </span>
          <h3 className="map-popup__title">{selected.name}</h3>
          <p className="map-popup__meta text-secondary">
            {selected.isActive ? t('status.active') : t('status.inactive')} ·{' '}
            {selected.isPublished ? t('status.published') : t('status.unpublished')}
          </p>
          <div className="map-popup__actions">
            {isPlatformTier ? (
              <>
                {!(selected.isActive && selected.isPublished) ? (
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
              </>
            ) : null}
            {canTogglePublish ? (
              selected.isPublished ? (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={pending}
                  onClick={() => act('unpublish', selected)}
                >
                  <EyeOff size={15} strokeWidth={2} aria-hidden="true" />
                  {t('actions.unpublish')}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={pending}
                  onClick={() => act('publish', selected)}
                >
                  <Eye size={15} strokeWidth={2} aria-hidden="true" />
                  {t('actions.publish')}
                </button>
              )
            ) : null}
            <Link
              href={`${pathname}/${selected.id}`}
              className="btn btn--secondary btn--sm"
            >
              {t('actions.edit')}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
