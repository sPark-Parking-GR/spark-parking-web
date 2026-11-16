'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { useDashboardLoading } from '@/components/DashboardLoading'

export function useDashboardTransition() {
  const [pending, startTransition] = useTransition()
  const { setLoading } = useDashboardLoading()

  useEffect(() => {
    if (!pending) return
    setLoading(true)
    return () => setLoading(false)
  }, [pending, setLoading])

  return [pending, startTransition] as const
}

export function useRefresh() {
  const router = useRouter()
  const [pending, startTransition] = useDashboardTransition()
  const refresh = () => startTransition(() => router.refresh())
  return { pending, refresh }
}
