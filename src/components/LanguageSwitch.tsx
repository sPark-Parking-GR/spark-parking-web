'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { SegmentedControl } from '@spark/ui'
import { setLocale } from '@/lib/locale'
import { isLocale } from '@/i18n/locales'

const OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'el', label: 'ΕΛ' },
]

export function LanguageSwitch() {
  const locale = useLocale()
  const router = useRouter()
  const [, startTransition] = useTransition()

  const handleChange = (next: string) => {
    if (!isLocale(next) || next === locale) return
    startTransition(() => {
      void setLocale(next).then(() => router.refresh())
    })
  }

  return (
    <SegmentedControl
      options={OPTIONS}
      value={locale}
      onChange={handleChange}
      size="sm"
    />
  )
}
