'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, Power, PowerOff, Trash2 } from 'lucide-react'
import { Badge } from '@spark/ui'
import type { UserRole } from '@spark/types'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { SparkMark } from './SparkMark'
import { bulkFacilityAction } from '@/lib/facility-actions'
import { KIND_META } from '@/lib/facility-display'
import { usePersistentSelection } from '@/lib/use-persistent-selection'
import type { AdminFacilityListItem, BulkFacilityAction } from '@/lib/api'

const SELECTION_KEY = 'facilities:card-selection'

interface Props {
  items: AdminFacilityListItem[]
  role: UserRole
}

export function FacilityCardGrid({ items, role }: Props) {
  const t = useTranslations('facilities')
  const router = useRouter()
  const canBulkAct = role === 'operator_admin'

  const [selected, setSelected] = usePersistentSelection(SELECTION_KEY)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null)

  const selectedIds = Array.from(selected)

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const execute = (action: BulkFacilityAction, ids: string[]) => {
    setError(null)
    startTransition(async () => {
      const res = await bulkFacilityAction(action, ids)
      if (!res.ok) {
        setError(res.detail ?? t(res.errorKey))
        return
      }
      setSelected(new Set())
      setConfirmDeleteIds(null)
      router.refresh()
    })
  }

  const run = (action: BulkFacilityAction, ids: string[]) => {
    if (ids.length === 0) return
    if (action === 'delete') {
      setConfirmDeleteIds(ids)
      return
    }
    execute(action, ids)
  }

  return (
    <div className="facilities-manager">
      {error ? (
        <div className="form-banner form-banner--error" role="alert">
          {error}
        </div>
      ) : null}

      {canBulkAct && selected.size > 0 ? (
        <div className="bulk-bar" role="toolbar" aria-label={t('table.bulkActionsLabel')}>
          <span className="bulk-bar__count">
            {t('table.selectedCount', { count: selected.size })}
            {pending ? <Spinner size={14} /> : null}
          </span>
          <div className="bulk-bar__actions">
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={pending}
              onClick={() => run('enable', selectedIds)}
            >
              <Power size={15} strokeWidth={2} aria-hidden="true" />
              {t('actions.activate')}
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={pending}
              onClick={() => run('disable', selectedIds)}
            >
              <PowerOff size={15} strokeWidth={2} aria-hidden="true" />
              {t('actions.deactivate')}
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={pending}
              onClick={() => run('publish', selectedIds)}
            >
              <Eye size={15} strokeWidth={2} aria-hidden="true" />
              {t('actions.publish')}
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={pending}
              onClick={() => run('unpublish', selectedIds)}
            >
              <EyeOff size={15} strokeWidth={2} aria-hidden="true" />
              {t('actions.unpublish')}
            </button>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              disabled={pending}
              onClick={() => run('delete', selectedIds)}
            >
              <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
              {t('actions.delete')}
            </button>
          </div>
          <button type="button" className="bulk-bar__clear" onClick={() => setSelected(new Set())}>
            {t('actions.clear')}
          </button>
        </div>
      ) : null}

      <div className="facility-card-grid">
        {items.map((item) => {
          const kind = KIND_META[item.kind]
          const isSelected = selected.has(item.id)
          return (
            <div key={item.id} className={`facility-card-tile${isSelected ? ' is-selected' : ''}`}>
              {canBulkAct ? (
                <label
                  className="facility-card__select checkbox-label"
                  aria-label={t('table.selectOne', { name: item.name })}
                >
                  <input type="checkbox" checked={isSelected} onChange={() => toggle(item.id)} />
                </label>
              ) : null}
              <Link href={`/dashboard/facilities/${item.id}`} className="facility-card">
                <div className="facility-card__header">
                  <span className="facility-card__icon">
                    <SparkMark size={22} />
                  </span>
                  <div className="facility-card__identity">
                    <span className="facility-card__name">{item.name}</span>
                    <span className="facility-card__address">{item.address}</span>
                  </div>
                </div>

                <div className="facility-card__badges">
                  <Badge variant={item.isActive ? 'ok' : 'warn'}>
                    {item.isActive ? t('status.active') : t('status.inactive')}
                  </Badge>
                  <Badge variant={item.isVerified ? 'ok' : 'warn'}>
                    {item.isVerified ? t('status.verified') : t('status.pending')}
                  </Badge>
                  <span className={`badge ${kind.badge}`}>{t(kind.labelKey)}</span>
                </div>

                <div className="facility-card__divider" />

                <div className="facility-card__stats">
                  <div className="facility-card__stat">
                    <span className="facility-card__stat-value">{item.totalCapacity}</span>
                    <span className="facility-card__stat-label">{t('stats.totalSpots')}</span>
                  </div>
                  <div className="facility-card__stat">
                    <span className="facility-card__stat-value">{item.onlineQuota}</span>
                    <span className="facility-card__stat-label">{t('stats.onlineQuota')}</span>
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      <Modal
        open={confirmDeleteIds !== null}
        onClose={() => setConfirmDeleteIds(null)}
        title={t('confirm.deleteTitle')}
      >
        {confirmDeleteIds ? (
          <>
            <p className="modal__text">
              {t('confirm.deleteBody', { count: confirmDeleteIds.length })}
            </p>
            {error ? (
              <p className="form-banner form-banner--error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setConfirmDeleteIds(null)}
              >
                {t('actions.cancel')}
              </button>
              <button
                type="button"
                className="btn btn--danger-solid"
                disabled={pending}
                onClick={() => execute('delete', confirmDeleteIds)}
              >
                {pending ? (
                  <>
                    <Spinner size={15} />
                    {t('confirm.working')}
                  </>
                ) : (
                  t('actions.delete')
                )}
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  )
}
