'use client'

import { useTranslations } from 'next-intl'
import { GoogleLocationPicker } from '@/components/maps/GoogleLocationPicker'

export interface LocationPickerProps {
  lat: number | null
  lng: number | null
  onChange?: (lat: number, lng: number) => void
  readOnly?: boolean
}

const PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER ?? 'google'

export function FacilityLocationPicker(props: LocationPickerProps) {
  const t = useTranslations('facilities')
  switch (PROVIDER) {
    case 'google':
      return <GoogleLocationPicker {...props} />
    default:
      return (
        <p className="facility-map__fallback">
          {t('map.unsupportedProvider')} <code>{PROVIDER}</code>
        </p>
      )
  }
}
