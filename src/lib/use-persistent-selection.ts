'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Selection state persisted to sessionStorage so it survives route navigation
 * (e.g. paginating the facilities table remounts the component but keeps the set).
 */
export function usePersistentSelection(storageKey: string) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) setSelected(new Set(JSON.parse(raw) as string[]))
    } catch {
      // storage unavailable — fall back to in-memory selection
    }
  }, [storageKey])

  const update = useCallback(
    (next: Set<string>) => {
      setSelected(next)
      try {
        if (next.size === 0) sessionStorage.removeItem(storageKey)
        else sessionStorage.setItem(storageKey, JSON.stringify([...next]))
      } catch {
        // ignore persistence failure
      }
    },
    [storageKey],
  )

  return [selected, update] as const
}
