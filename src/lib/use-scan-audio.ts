'use client'

import { useCallback, useRef, useState } from 'react'

type ToneVariant = 'success' | 'warn' | 'error'

const TONE_FREQUENCIES: Record<ToneVariant, number[]> = {
  success: [880, 1175],
  warn: [660, 660],
  error: [220],
}

const STEP_SECONDS = 0.11

export function useScanAudio() {
  const contextRef = useRef<AudioContext | null>(null)
  const [muted, setMuted] = useState(false)
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  const play = useCallback((variant: ToneVariant) => {
    if (mutedRef.current || typeof window === 'undefined' || !window.AudioContext) return

    if (!contextRef.current) {
      contextRef.current = new window.AudioContext()
    }
    const ctx = contextRef.current
    if (ctx.state === 'suspended') void ctx.resume()

    TONE_FREQUENCIES[variant].forEach((freq, i) => {
      const start = ctx.currentTime + i * STEP_SECONDS
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = variant === 'error' ? 'sawtooth' : 'sine'
      oscillator.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.25, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, start + STEP_SECONDS * 0.9)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(start)
      oscillator.stop(start + STEP_SECONDS)
    })
  }, [])

  return {
    playSuccess: () => play('success'),
    playWarn: () => play('warn'),
    playError: () => play('error'),
    muted,
    toggleMuted: useCallback(() => setMuted((prev) => !prev), []),
  }
}
