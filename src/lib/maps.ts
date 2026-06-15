import { createMapContext } from '@parqin/maps'
import type { MapProviderConfig } from '@parqin/maps'

function getMapsConfig(): MapProviderConfig {
  const provider = (process.env['MAP_PROVIDER'] ?? 'google') as MapProviderConfig['provider']

  switch (provider) {
    case 'mapbox':
      return {
        provider: 'mapbox',
        config: { accessToken: process.env['NEXT_PUBLIC_MAPBOX_TOKEN']! },
      }
    case 'google':
    default:
      return {
        provider: 'google',
        config: { apiKey: process.env['NEXT_PUBLIC_GOOGLE_MAPS_KEY']! },
      }
  }
}

export const maps = createMapContext(getMapsConfig())
