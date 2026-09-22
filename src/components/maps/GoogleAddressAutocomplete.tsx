'use client'

import { useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps'
import { useDebouncedCallback } from '@/lib/use-debounced-callback'

export interface AddressAutocompleteProps {
  name: string
  value: string
  onChange: (value: string) => void
  onPlaceSelected: (result: { address: string; lat: number; lng: number }) => void
  required?: boolean
  disabled?: boolean
  className?: string
}

const DEBOUNCE_MS = 350

function AutocompleteInput({
  name,
  value,
  onChange,
  onPlaceSelected,
  required,
  disabled,
  className,
}: AddressAutocompleteProps) {
  const placesLib = useMapsLibrary('places')
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const [suggestions, setSuggestions] = useState<google.maps.places.PlacePrediction[]>([])
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useDebouncedCallback(async (input: string) => {
    if (!placesLib || !input.trim()) {
      setSuggestions([])
      setOpen(false)
      return
    }
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken()
    }
    try {
      const { suggestions: results } =
        await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          includedRegionCodes: ['gr'],
          sessionToken: sessionTokenRef.current,
        })
      const predictions = results
        .map((s) => s.placePrediction)
        .filter((p): p is google.maps.places.PlacePrediction => p !== null)
      setSuggestions(predictions)
      setOpen(predictions.length > 0)
      setHighlighted(-1)
    } catch {
      setSuggestions([])
      setOpen(false)
    }
  }, DEBOUNCE_MS)

  // Only user keystrokes trigger a new search — a selection below updates `value` too,
  // but never re-triggers fetchSuggestions, so there's no picking-your-own-echo loop.
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    fetchSuggestions(e.target.value)
  }

  const select = async (prediction: google.maps.places.PlacePrediction) => {
    setOpen(false)
    setSuggestions([])
    const place = prediction.toPlace()
    const { place: fetched } = await place.fetchFields({ fields: ['formattedAddress', 'location'] })
    if (fetched.location) {
      onPlaceSelected({
        address: fetched.formattedAddress ?? prediction.text.text,
        lat: fetched.location.lat(),
        lng: fetched.location.lng(),
      })
    }
    // The session concluded at fetchFields — start a fresh one for the next search.
    sessionTokenRef.current = placesLib ? new placesLib.AutocompleteSessionToken() : null
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (highlighted >= 0) {
        e.preventDefault()
        const prediction = suggestions[highlighted]
        if (prediction) void select(prediction)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div
      className="address-autocomplete"
      ref={containerRef}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <input
        className={className}
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        required={required}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${name}-suggestions`}
      />
      {open ? (
        <ul id={`${name}-suggestions`} className="address-autocomplete__list" role="listbox">
          {suggestions.map((prediction, i) => (
            <li
              key={prediction.placeId}
              role="option"
              aria-selected={i === highlighted}
              className={`address-autocomplete__option${i === highlighted ? ' is-highlighted' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                void select(prediction)
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              <span className="address-autocomplete__main">
                {prediction.mainText?.text ?? prediction.text.text}
              </span>
              {prediction.secondaryText ? (
                <span className="address-autocomplete__secondary">
                  {prediction.secondaryText.text}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function PlainAddressInput({
  name,
  value,
  onChange,
  required,
  disabled,
  className,
}: AddressAutocompleteProps) {
  return (
    <input
      className={className}
      type="text"
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
    />
  )
}

export function GoogleAddressAutocomplete(props: AddressAutocompleteProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!apiKey) return <PlainAddressInput {...props} />

  return (
    <APIProvider apiKey={apiKey}>
      <AutocompleteInput {...props} />
    </APIProvider>
  )
}
