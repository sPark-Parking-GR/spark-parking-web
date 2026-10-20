'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Spinner } from './Spinner'
import { MOBILE_SIGN_IN_PROVIDERS, MOBILE_USER_STATUSES } from '@/lib/mobile-user-schema'

export function MobileUsersFilters() {
  const t = useTranslations('adminMobileUsers')
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
        aria-label={t('filters.statusAria')}
        value={searchParams.get('status') ?? ''}
        onChange={(e) => setParam('status', e.target.value)}
      >
        <option value="">{t('filters.anyStatus')}</option>
        {MOBILE_USER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {t(`status.${status}`)}
          </option>
        ))}
      </select>
      <select
        className="input filter-bar__select"
        aria-label={t('filters.providerAria')}
        value={searchParams.get('provider') ?? ''}
        onChange={(e) => setParam('provider', e.target.value)}
      >
        <option value="">{t('filters.anyProvider')}</option>
        {MOBILE_SIGN_IN_PROVIDERS.map((provider) => (
          <option key={provider} value={provider}>
            {t(`provider.${provider}`)}
          </option>
        ))}
      </select>
      {isPending ? <Spinner size={15} className="filter-bar__spinner" /> : null}
    </div>
  )
}
