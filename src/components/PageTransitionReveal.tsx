'use client'

import { useEffect } from 'react'
import { usePageTransitionOverlay } from './PageTransitionOverlay'

/**
 * Mounted once inside the dashboard layout. If a page-transition cover is up
 * (set by LoginShell before navigating here), this fades it away now that the
 * dashboard has actually mounted — bridging the login exit and the dashboard's
 * own entrance instead of leaving a hard cut between them.
 */
export function PageTransitionReveal() {
  const { reveal } = usePageTransitionOverlay()

  useEffect(() => {
    reveal()
  }, [reveal])

  return null
}
