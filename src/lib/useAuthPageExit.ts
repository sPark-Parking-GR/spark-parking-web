'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePageTransitionOverlay } from '@/components/PageTransitionOverlay'

// Must match the exit animation duration in globals.css (fadeOutForward = 380ms).
export const AUTH_EXIT_DURATION_MS = 380

/**
 * Shared by every auth-card flow that can succeed and move on (login, register,
 * invite accept): plays the card/brand exit animation, covers the page-transition
 * overlay in step with it, then navigates once both are done — so the handoff to
 * whatever comes next never lands as a hard cut.
 */
export function useAuthPageExit() {
  const router = useRouter()
  const { cover } = usePageTransitionOverlay()
  const [isExiting, setIsExiting] = useState(false)
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // If the person navigates away themselves while the exit is queued, the queued push must not
  // override where they chose to go.
  useEffect(
    () => () => {
      if (exitTimer.current !== null) clearTimeout(exitTimer.current)
    },
    [],
  )

  const triggerExit = useCallback(
    (redirectTo: string) => {
      setIsExiting(true)
      cover()
      exitTimer.current = setTimeout(() => {
        router.push(redirectTo)
      }, AUTH_EXIT_DURATION_MS)
    },
    [cover, router],
  )

  return { isExiting, triggerExit }
}
