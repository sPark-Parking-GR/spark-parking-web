import type { FacilityKind, FacilitySource } from './api'

export const KIND_META: Record<FacilityKind, { label: string; badge: string }> = {
  BUSINESS: { label: 'Business', badge: 'badge--info' },
  FREE_PUBLIC: { label: 'Free public', badge: 'badge--success' },
  RESTRICTED: { label: 'Restricted', badge: 'badge--warning' },
  UNKNOWN: { label: 'Unknown', badge: 'badge--neutral' },
}

export const KIND_OPTIONS: { value: FacilityKind; label: string }[] = (
  Object.keys(KIND_META) as FacilityKind[]
).map((value) => ({ value, label: KIND_META[value].label }))

export function sourceLabel(source: FacilitySource): string {
  switch (source) {
    case 'OSM':
      return 'OpenStreetMap'
    case 'GOOGLE':
      return 'Google'
    case 'MANUAL':
      return 'Manual'
    default:
      return 'Manual'
  }
}
