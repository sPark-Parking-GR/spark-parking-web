'use client'

import { useEffect, useState } from 'react'

export function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** Whole seconds left until `until` (epoch ms), ticking once a second; 0 when not running. */
export function useCountdown(until: number): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (until <= Date.now()) return
    setNow(Date.now())
    const timer = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= until) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [until])

  return Math.max(0, Math.ceil((until - now) / 1000))
}
