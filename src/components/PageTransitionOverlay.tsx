'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface PageTransitionOverlayContextValue {
  cover: () => void
  reveal: () => void
}

const PageTransitionOverlayContext = createContext<PageTransitionOverlayContextValue | null>(null)

// Give the newly-mounted route a moment to paint before fading the cover away,
// so reveal never uncovers a half-styled first frame.
const REVEAL_DELAY_MS = 120
const REVEAL_DURATION_MS = 450

export function PageTransitionOverlayProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [covered, setCovered] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cover = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setVisible(true)
    requestAnimationFrame(() => setCovered(true))
  }, [])

  const reveal = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setCovered(false)
      timeoutRef.current = setTimeout(() => setVisible(false), REVEAL_DURATION_MS)
    }, REVEAL_DELAY_MS)
  }, [])

  const value = useMemo(() => ({ cover, reveal }), [cover, reveal])

  return (
    <PageTransitionOverlayContext.Provider value={value}>
      {children}
      <div
        aria-hidden="true"
        className={covered ? 'page-transition-cover page-transition-cover--covered' : 'page-transition-cover'}
        hidden={!visible}
      />
    </PageTransitionOverlayContext.Provider>
  )
}

export function usePageTransitionOverlay(): PageTransitionOverlayContextValue {
  const ctx = useContext(PageTransitionOverlayContext)
  if (!ctx) {
    throw new Error('usePageTransitionOverlay must be used within PageTransitionOverlayProvider')
  }
  return ctx
}
