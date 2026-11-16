'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface DashboardLoadingValue {
  loading: boolean
  setLoading: (loading: boolean) => void
}

// Defaults to inert so a page rendered on its own (a test, a story) needs no provider.
const DashboardLoadingContext = createContext<DashboardLoadingValue>({
  loading: false,
  setLoading: () => undefined,
})

export function DashboardLoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false)
  const value = useMemo(() => ({ loading, setLoading }), [loading])

  return (
    <DashboardLoadingContext.Provider value={value}>{children}</DashboardLoadingContext.Provider>
  )
}

export function useDashboardLoading(): DashboardLoadingValue {
  return useContext(DashboardLoadingContext)
}
