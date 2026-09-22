'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Spinner } from './Spinner'
import { IDENTITY_LIFECYCLE_STATUSES, IDENTITY_ROLES } from '@/lib/identity-types'

export function UsersFilters() {
  const t = useTranslations('adminUsers')
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
        aria-label={t('filters.roleAria')}
        value={searchParams.get('role') ?? ''}
        onChange={(e) => setParam('role', e.target.value)}
      >
        <option value="">{t('filters.anyRole')}</option>
        {IDENTITY_ROLES.map((role) => (
          <option key={role} value={role}>
            {t(`role.${role}`)}
          </option>
        ))}
      </select>
      <select
        className="input filter-bar__select"
        aria-label={t('filters.statusAria')}
        value={searchParams.get('lifecycleStatus') ?? 'ACTIVE'}
        onChange={(e) => setParam('lifecycleStatus', e.target.value)}
      >
        <option value="ALL">{t('filters.anyStatus')}</option>
        {IDENTITY_LIFECYCLE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {t(`status.${status}`)}
          </option>
        ))}
      </select>
      {isPending ? <Spinner size={15} className="filter-bar__spinner" /> : null}
    </div>
  )
}
