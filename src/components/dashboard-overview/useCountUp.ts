'use client'

import { useLayoutEffect, useState } from 'react'

const DURATION_MS = 900

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

export function useCountUp(target: number): number {
  const [value, setValue] = useState(target)

  useLayoutEffect(() => {
    if (target === 0 || prefersReducedMotion()) {
      setValue(target)
      return
    }
    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS)
      setValue(target * (1 - Math.pow(1 - progress, 4)))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    setValue(0)
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return value
}
