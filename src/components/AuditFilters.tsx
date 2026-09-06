'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ReactElement } from 'react'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Spinner } from './Spinner'
import { actionLabel, AUDIT_ACTIONS } from '@/lib/audit-format'

export function AuditFilters(): ReactElement {
  const t = useTranslations('insights.audit')
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

  const sortedActions = [...AUDIT_ACTIONS].sort((a, b) =>
    actionLabel(t, a).localeCompare(actionLabel(t, b)),
  )

  return (
    <div className="filter-bar">
      <select
        className="input filter-bar__select"
        aria-label={t('filters.actionAria')}
        value={searchParams.get('action') ?? ''}
        onChange={(e) => setParam('action', e.target.value)}
      >
        <option value="">{t('filters.anyAction')}</option>
        {sortedActions.map((action) => (
          <option key={action} value={action}>
            {actionLabel(t, action)}
          </option>
        ))}
      </select>
      {isPending ? <Spinner size={15} className="filter-bar__spinner" /> : null}
    </div>
  )
}
