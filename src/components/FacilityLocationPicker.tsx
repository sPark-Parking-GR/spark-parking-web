'use client'

import { GoogleLocationPicker } from '@/components/maps/GoogleLocationPicker'

export interface LocationPickerProps {
  lat: number | null
  lng: number | null
  onChange?: (lat: number, lng: number) => void
  readOnly?: boolean
}

const PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER ?? 'google'

export function FacilityLocationPicker(props: LocationPickerProps) {
  switch (PROVIDER) {
    case 'google':
      return <GoogleLocationPicker {...props} />
    default:
      return (
        <p className="facility-map__fallback">
          Unsupported map provider: <code>{PROVIDER}</code>
        </p>
      )
  }
}
