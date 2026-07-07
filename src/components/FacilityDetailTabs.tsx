'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Tabs } from '@spark/ui'

export function FacilityDetailTabs({ active }: { active: string }) {
  const t = useTranslations('facilities')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const ITEMS = [
    { key: 'overview', label: t('detail.overviewTab') },
    { key: 'manage', label: t('detail.manageTab') },
  ]

  const select = (tab: string) => {
    if (tab === active) return
    const params = new URLSearchParams(searchParams)
    if (tab === 'overview') params.delete('tab')
    else params.set('tab', tab)
    const qs = params.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <div className="facility-detail-tabs">
      <Tabs items={ITEMS} active={active} onChange={select} />
    </div>
  )
}
