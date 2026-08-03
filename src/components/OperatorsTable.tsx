'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import { EmptyState } from './EmptyState'
import { SuspendOperatorButton } from './SuspendOperatorButton'
import { ReactivateOperatorButton } from './ReactivateOperatorButton'
import type { OperatorLifecycleStatus, OperatorStatus, OperatorSummary } from '@/lib/operator-actions'

interface Props {
  items: OperatorSummary[]
  canWrite: boolean
}

const STATUS_BADGE: Record<OperatorStatus, { labelKey: string; variant: BadgeVariant }> = {
  PENDING: { labelKey: 'operatorStatus.pending', variant: 'warn' },
  VERIFIED: { labelKey: 'operatorStatus.verified', variant: 'ok' },
  SUSPENDED: { labelKey: 'operatorStatus.suspended', variant: 'bad' },
}

const LIFECYCLE_BADGE_VARIANT: Record<Exclude<OperatorLifecycleStatus, 'ACTIVE'>, BadgeVariant> = {
  ARCHIVED: 'warn',
  TOMBSTONED: 'bad',
  PURGED: 'neutral',
}

const STATUS_FILTERS: Array<OperatorStatus | 'ALL'> = ['ALL', 'PENDING', 'VERIFIED', 'SUSPENDED']

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function OperatorsTable({ items, canWrite }: Props) {
  const t = useTranslations('onboarding')
  const tLifecycle = useTranslations('adminLifecycle')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OperatorStatus | 'ALL'>('ALL')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
      if (q && !item.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, query, statusFilter])

  return (
    <>
      <div className="table-toolbar">
        <div className="search-field">
          <Search size={16} strokeWidth={2} className="search-field__icon" aria-hidden="true" />
          <input
            className="input search-field__input"
            type="search"
            value={query}
            placeholder={t('operators.searchPlaceholder')}
            aria-label={t('operators.searchPlaceholder')}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="filter-bar">
          <select
            className="input filter-bar__select"
            value={statusFilter}
            aria-label={t('operators.filters.statusAria')}
            onChange={(e) => setStatusFilter(e.target.value as OperatorStatus | 'ALL')}
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? t('operators.filters.anyStatus') : t(STATUS_BADGE[status].labelKey)}
              </option>
            ))}
          </select>
        </div>
        <span className="text-secondary table-toolbar__count">
          {t('operators.count', { count: filtered.length })}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('operators.empty.title')} message={t('operators.emptyFiltered')} />
      ) : (
        <div className="table-wrapper fade-in">
          <table className="table">
            <thead>
              <tr>
                <th>{t('operatorTable.name')}</th>
                <th>{t('operatorTable.status')}</th>
                <th>{t('operatorTable.facilities')}</th>
                <th>{t('operatorTable.members')}</th>
                <th>{t('operatorTable.createdAt')}</th>
                <th>{t('operatorTable.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const badge = STATUS_BADGE[item.status]
                const lifecycleVariant =
                  item.lifecycleStatus !== 'ACTIVE' ? LIFECYCLE_BADGE_VARIANT[item.lifecycleStatus] : null
                return (
                  <tr key={item.id}>
                    <td className="table-facility">
                      <Link href={`/dashboard/admin/operators/${item.id}`} className="table-link">
                        {item.name}
                      </Link>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Badge variant={badge.variant}>{t(badge.labelKey)}</Badge>
                        {lifecycleVariant ? (
                          <Badge variant={lifecycleVariant}>
                            {tLifecycle(`status.${item.lifecycleStatus}`)}
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="text-secondary">{item.facilityCount}</td>
                    <td className="text-secondary">{item.memberCount}</td>
                    <td className="text-secondary">{dateFmt.format(new Date(item.createdAt))}</td>
                    <td>
                      {item.status === 'VERIFIED' && canWrite ? (
                        <SuspendOperatorButton id={item.id} />
                      ) : item.status === 'SUSPENDED' && canWrite ? (
                        <ReactivateOperatorButton id={item.id} />
                      ) : (
                        <span className="text-secondary">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
