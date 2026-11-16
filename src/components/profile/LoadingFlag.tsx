'use client'

import { useEffect } from 'react'
import { useDashboardLoading } from '@/components/DashboardLoading'

/** Lights the shell's 2px header progress line for as long as it is mounted. */
export function LoadingFlag() {
  const { setLoading } = useDashboardLoading()

  useEffect(() => {
    setLoading(true)
    return () => setLoading(false)
  }, [setLoading])

  return null
}
