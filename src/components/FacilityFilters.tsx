'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Spinner } from './Spinner'
import { KIND_OPTIONS } from '@/lib/facility-display'

export function FacilityFilters() {
  const t = useTranslations('facilities')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const STATUS_OPTIONS = [
    { value: '', label: t('filters.anyStatus') },
    { value: 'active', label: t('status.active') },
    { value: 'inactive', label: t('status.inactive') },
  ]

  const PUBLISHED_OPTIONS = [
    { value: '', label: t('filters.anyPublished') },
    { value: 'published', label: t('status.published') },
    { value: 'unpublished', label: t('status.unpublished') },
  ]

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('skip')
    const qs = params.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <div className="filter-bar">
      <select
        className="input filter-bar__select"
        aria-label={t('filters.statusAria')}
        value={searchParams.get('status') ?? ''}
        onChange={(e) => setParam('status', e.target.value)}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        className="input filter-bar__select"
        aria-label={t('filters.publishedAria')}
        value={searchParams.get('published') ?? ''}
        onChange={(e) => setParam('published', e.target.value)}
      >
        {PUBLISHED_OPTIONS.map((o) => (
          <option key={o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        className="input filter-bar__select"
        aria-label={t('filters.kindAria')}
        value={searchParams.get('kind') ?? ''}
        onChange={(e) => setParam('kind', e.target.value)}
      >
        <option value="">{t('filters.anyKind')}</option>
        {KIND_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {t(o.labelKey)}
          </option>
        ))}
      </select>
      {isPending ? <Spinner size={15} className="filter-bar__spinner" /> : null}
    </div>
  )
}
