'use client'

import type { ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'

interface Props {
  overview: ReactNode
  manage: ReactNode
}

// loading.tsx can't read searchParams itself (only page.tsx receives that prop), so the
// two skeleton shapes are rendered server-side by the parent and handed down as elements —
// this client component just picks which one matches the tab being navigated to.
export function FacilityDetailLoadingSwitch({ overview, manage }: Props) {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') === 'manage' ? 'manage' : 'overview'
  return <>{tab === 'manage' ? manage : overview}</>
}
