'use client'

import { useEffect, useMemo, useRef } from 'react'

export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay: number,
): (...args: A) => void {
  const fnRef = useRef(fn)
  fnRef.current = fn
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return useMemo(
    () =>
      (...args: A) => {
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => fnRef.current(...args), delay)
      },
    [delay],
  )
}
