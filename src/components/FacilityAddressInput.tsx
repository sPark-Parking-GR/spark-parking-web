'use client'

import { GoogleAddressAutocomplete } from '@/components/maps/GoogleAddressAutocomplete'
import type { AddressAutocompleteProps } from '@/components/maps/GoogleAddressAutocomplete'

const PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER ?? 'google'

export function FacilityAddressInput(props: AddressAutocompleteProps) {
  switch (PROVIDER) {
    case 'google':
      return <GoogleAddressAutocomplete {...props} />
    default:
      return (
        <input
          className={props.className}
          type="text"
          name={props.name}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          required={props.required}
          disabled={props.disabled}
        />
      )
  }
}
