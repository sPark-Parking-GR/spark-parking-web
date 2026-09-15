'use client'

import { useCallback, useState } from 'react'
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

  const triggerExit = useCallback(
    (redirectTo: string) => {
      setIsExiting(true)
      cover()
      setTimeout(() => {
        router.push(redirectTo)
      }, AUTH_EXIT_DURATION_MS)
    },
    [cover, router],
  )

  return { isExiting, triggerExit }
}
