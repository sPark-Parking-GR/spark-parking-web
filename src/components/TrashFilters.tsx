'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Spinner } from './Spinner'
import { LIFECYCLE_RESOURCE_TYPES, LIFECYCLE_STATUSES } from '@/lib/lifecycle-constants'

export function TrashFilters() {
  const t = useTranslations('adminLifecycle')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

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
        aria-label={t('trash.filters.resourceTypeAria')}
        value={searchParams.get('resourceType') ?? ''}
        onChange={(e) => setParam('resourceType', e.target.value)}
      >
        <option value="">{t('trash.filters.anyResourceType')}</option>
        {LIFECYCLE_RESOURCE_TYPES.map((rt) => (
          <option key={rt} value={rt}>
            {t(`resourceType.${rt}`)}
          </option>
        ))}
      </select>
      <select
        className="input filter-bar__select"
        aria-label={t('trash.filters.statusAria')}
        value={searchParams.get('status') ?? ''}
        onChange={(e) => setParam('status', e.target.value)}
      >
        <option value="">{t('trash.filters.anyStatus')}</option>
        {LIFECYCLE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {t(`status.${status}`)}
          </option>
        ))}
      </select>
      {isPending ? <Spinner size={15} className="filter-bar__spinner" /> : null}
    </div>
  )
}
