import type { FacilityKind, FacilitySource } from './api'

export const KIND_META: Record<FacilityKind, { labelKey: string; badge: string }> = {
  BUSINESS: { labelKey: 'kind.business', badge: 'badge--info' },
  FREE_PUBLIC: { labelKey: 'kind.freePublic', badge: 'badge--success' },
  RESTRICTED: { labelKey: 'kind.restricted', badge: 'badge--warning' },
  UNKNOWN: { labelKey: 'kind.unknown', badge: 'badge--neutral' },
}

export const KIND_OPTIONS: { value: FacilityKind; labelKey: string }[] = (
  Object.keys(KIND_META) as FacilityKind[]
).map((value) => ({ value, labelKey: KIND_META[value].labelKey }))

export function sourceLabelKey(source: FacilitySource): string {
  switch (source) {
    case 'OSM':
      return 'source.osm'
    case 'GOOGLE':
      return 'source.google'
    case 'MANUAL':
      return 'source.manual'
    default:
      return 'source.manual'
  }
}
