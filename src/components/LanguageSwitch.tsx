'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { setLocale } from '@/lib/locale'
import { isLocale } from '@/i18n/locales'

const OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'el', label: 'ΕΛ' },
]

export function LanguageSwitch() {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations('shell')
  const [, startTransition] = useTransition()

  const handleChange = (next: string) => {
    if (!isLocale(next) || next === locale) return
    startTransition(() => {
      void setLocale(next).then(() => router.refresh())
    })
  }

  return (
    <div className="ds-lang" role="group" aria-label={t('language')}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          lang={option.value}
          aria-pressed={option.value === locale}
          onClick={() => handleChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
