'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Banknote, Pencil, Power, PowerOff, Rocket, Trash2 } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { AssignTariffModal } from './AssignTariffModal'
import { bulkFacilityAction, getFacilityTariffAssignmentsAction } from '@/lib/facility-actions'
import { KIND_META, sourceLabelKey } from '@/lib/facility-display'
import { usePersistentSelection } from '@/lib/use-persistent-selection'
import type {
  AdminFacilityListItem,
  AssignTariffInput,
  BulkFacilityAction,
  FacilityTariffAssignment,
  FacilityTariffPlan,
} from '@/lib/api'

const SELECTION_KEY = 'facilities:selection'

interface Props {
  items: AdminFacilityListItem[]
  tariffPlans: FacilityTariffPlan[]
}

const CONFIRMABLE: BulkFacilityAction[] = ['deploy', 'delete']

export function FacilitiesManager({ items, tariffPlans }: Props) {
  const t = useTranslations('facilities')
  const router = useRouter()

  const CONFIRM_COPY: Record<
    'deploy' | 'delete',
    { title: string; body: (n: number) => string; cta: string; danger: boolean }
  > = {
    deploy: {
      title: t('confirm.deployTitle'),
      body: (n) => t('confirm.deployBody', { count: n }),
      cta: t('actions.deploy'),
      danger: false,
    },
    delete: {
      title: t('confirm.deleteTitle'),
      body: (n) => t('confirm.deleteBody', { count: n }),
      cta: t('actions.delete'),
      danger: true,
    },
  }
  const [selected, setSelected] = usePersistentSelection(SELECTION_KEY)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ action: 'deploy' | 'delete'; ids: string[] } | null>(
    null,
  )
  const [assignTarget, setAssignTarget] = useState<{
    ids: string[]
    initialAssignments: FacilityTariffAssignment[] | null
    defaultPlan: { id: string; name: string } | null
  } | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignLoading, setAssignLoading] = useState(false)
  const headerCheck = useRef<HTMLInputElement>(null)

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id))
  const someSelected = items.some((i) => selected.has(i.id))

  useEffect(() => {
    if (headerCheck.current) headerCheck.current.indeterminate = someSelected && !allSelected
  }, [someSelected, allSelected])

  const selectedIds = useMemo(() => Array.from(selected), [selected])

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  // Page-scoped: toggles only the visible page's rows, preserving picks on other pages.
  const toggleAll = () => {
    const next = new Set(selected)
    if (allSelected) items.forEach((i) => next.delete(i.id))
    else items.forEach((i) => next.add(i.id))
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
      setConfirm(null)
      router.refresh()
    })
  }

  const run = (action: BulkFacilityAction, ids: string[]) => {
    if (ids.length === 0) return
    if (ids.length > 500) {
      setError(t('errors.tooManySelected'))
      return
    }
    if (CONFIRMABLE.includes(action)) {
      setConfirm({ action: action as 'deploy' | 'delete', ids })
      return
    }
    execute(action, ids)
  }

  const openAssign = async (ids: string[]) => {
    if (ids.length === 0) return
    if (ids.length > 500) {
      setError(t('errors.tooManySelected'))
      return
    }
    setAssignError(null)

    if (ids.length !== 1) {
      setAssignTarget({ ids, initialAssignments: null, defaultPlan: null })
      return
    }

    setAssignLoading(true)
    try {
      const facilityId = ids[0]
      if (!facilityId) return
      const result = await getFacilityTariffAssignmentsAction(facilityId)
      if (result === null) {
        setAssignError(t('errors.loadAssignmentsFailed'))
        setAssignTarget({ ids, initialAssignments: null, defaultPlan: null })
      } else {
        setAssignTarget({
          ids,
          initialAssignments: result.assignments,
          defaultPlan: result.defaultPlan,
        })
      }
    } finally {
      setAssignLoading(false)
    }
  }

  const submitAssign = (assignments: AssignTariffInput[]) => {
    if (!assignTarget) return
    setAssignError(null)
    startTransition(async () => {
      const res = await bulkFacilityAction('assignTariff', assignTarget.ids, assignments)
      if (!res.ok) {
        setAssignError(res.detail ?? t(res.errorKey))
        return
      }
      setSelected(new Set())
      setAssignTarget(null)
      router.refresh()
    })
  }

  return (
    <div className="facilities-manager">
      {error ? (
        <div className="form-banner form-banner--error" role="alert">
          {error}
        </div>
      ) : null}

      {selected.size > 0 ? (
        <div className="bulk-bar" role="toolbar" aria-label={t('table.bulkActionsLabel')}>
          <span className="bulk-bar__count">
            {t('table.selectedCount', { count: selected.size })}
            {pending ? <Spinner size={14} /> : null}
          </span>
          <div className="bulk-bar__actions">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={pending}
              onClick={() => run('deploy', selectedIds)}
            >
              <Rocket size={15} strokeWidth={2} aria-hidden="true" />
              {t('actions.deploy')}
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={pending}
              onClick={() => run('enable', selectedIds)}
            >
              <Power size={15} strokeWidth={2} aria-hidden="true" />
              {t('actions.enable')}
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={pending}
              onClick={() => run('disable', selectedIds)}
            >
              <PowerOff size={15} strokeWidth={2} aria-hidden="true" />
              {t('actions.disable')}
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={pending || assignLoading}
              onClick={() => openAssign(selectedIds)}
            >
              <Banknote size={15} strokeWidth={2} aria-hidden="true" />
              {t('actions.assignTariff')}
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

      <div className="table-wrapper">
        <table className="table table--sticky">
          <thead>
            <tr>
              <th className="table__check">
                <label className="checkbox-label" aria-label={t('table.selectAll')}>
                  <input
                    ref={headerCheck}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </label>
              </th>
              <th>{t('table.name')}</th>
              <th>{t('table.operator')}</th>
              <th>{t('table.kind')}</th>
              <th>{t('table.capacity')}</th>
              <th>{t('table.status')}</th>
              <th>{t('table.verified')}</th>
              <th className="table__actions-col" aria-label={t('table.actionsCol')} />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const kind = KIND_META[item.kind]
              const live = item.isActive && item.isVerified
              const isSelected = selected.has(item.id)
              return (
                <tr key={item.id} className={isSelected ? 'is-selected' : undefined}>
                  <td className="table__check">
                    <label
                      className="checkbox-label"
                      aria-label={t('table.selectOne', { name: item.name })}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(item.id)}
                      />
                    </label>
                  </td>
                  <td>
                    <Link href={`/admin/facilities/${item.id}`} className="table-link">
                      {item.name}
                    </Link>
                    <span className="table__sub">{item.address}</span>
                  </td>
                  <td className="text-secondary">
                    {item.operatorName ?? t('table.noOperator')}
                    <span className="table__sub">{t(sourceLabelKey(item.source))}</span>
                  </td>
                  <td>
                    <span className={`badge ${kind.badge}`}>{t(kind.labelKey)}</span>
                  </td>
                  <td>
                    {item.onlineQuota}/{item.totalCapacity}
                  </td>
                  <td>
                    {item.isActive ? (
                      <span className="badge badge--success">{t('status.active')}</span>
                    ) : (
                      <span className="badge badge--neutral">{t('status.inactive')}</span>
                    )}
                  </td>
                  <td>
                    {item.isVerified ? (
                      <span className="badge badge--success">{t('status.verified')}</span>
                    ) : (
                      <span className="badge badge--warning">{t('status.pending')}</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      {!live ? (
                        <button
                          type="button"
                          className="btn btn--icon btn--ghost-primary"
                          disabled={pending}
                          onClick={() => run('deploy', [item.id])}
                          aria-label={t('actions.deploy')}
                          data-tooltip={t('table.tooltipDeploy')}
                          data-tooltip-pos="bottom"
                        >
                          <Rocket size={17} strokeWidth={2} aria-hidden="true" />
                        </button>
                      ) : null}
                      {item.isActive ? (
                        <button
                          type="button"
                          className="btn btn--icon btn--ghost"
                          disabled={pending}
                          onClick={() => run('disable', [item.id])}
                          aria-label={t('actions.disable')}
                          data-tooltip={t('table.tooltipDisable')}
                          data-tooltip-pos="bottom"
                        >
                          <PowerOff size={17} strokeWidth={2} aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--icon btn--ghost"
                          disabled={pending}
                          onClick={() => run('enable', [item.id])}
                          aria-label={t('actions.enable')}
                          data-tooltip={t('table.tooltipEnable')}
                          data-tooltip-pos="bottom"
                        >
                          <Power size={17} strokeWidth={2} aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn--icon btn--ghost"
                        disabled={pending || assignLoading}
                        onClick={() => openAssign([item.id])}
                        aria-label={t('actions.assignTariff')}
                        data-tooltip={t('table.tooltipAssignTariff')}
                        data-tooltip-pos="bottom"
                      >
                        <Banknote size={17} strokeWidth={2} aria-hidden="true" />
                      </button>
                      <Link
                        href={`/admin/facilities/${item.id}?tab=manage`}
                        className="btn btn--icon btn--ghost"
                        aria-label={t('actions.edit')}
                        data-tooltip={t('table.tooltipEdit')}
                        data-tooltip-pos="bottom"
                      >
                        <Pencil size={16} strokeWidth={2} aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        className="btn btn--icon btn--ghost-danger"
                        disabled={pending}
                        onClick={() => run('delete', [item.id])}
                        aria-label={t('actions.delete')}
                        data-tooltip={t('table.tooltipDelete')}
                        data-tooltip-pos="bottom"
                      >
                        <Trash2 size={17} strokeWidth={2} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm ? CONFIRM_COPY[confirm.action].title : ''}
      >
        {confirm ? (
          <>
            <p className="modal__text">{CONFIRM_COPY[confirm.action].body(confirm.ids.length)}</p>
            {error ? (
              <p className="form-banner form-banner--error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="modal__footer">
              <button type="button" className="btn btn--secondary" onClick={() => setConfirm(null)}>
                {t('actions.cancel')}
              </button>
              <button
                type="button"
                className={
                  CONFIRM_COPY[confirm.action].danger ? 'btn btn--danger-solid' : 'btn btn--primary'
                }
                disabled={pending}
                onClick={() => execute(confirm.action, confirm.ids)}
              >
                {pending ? (
                  <>
                    <Spinner size={15} />
                    {t('confirm.working')}
                  </>
                ) : (
                  CONFIRM_COPY[confirm.action].cta
                )}
              </button>
            </div>
          </>
        ) : null}
      </Modal>

      <AssignTariffModal
        open={assignTarget !== null}
        onClose={() => setAssignTarget(null)}
        title={t('assignModal.assignPlanTitle')}
        description={
          assignTarget
            ? t('assignModal.assignPlanDescription', { count: assignTarget.ids.length })
            : ''
        }
        plans={tariffPlans}
        initialAssignments={assignTarget?.initialAssignments ?? null}
        defaultPlan={assignTarget?.defaultPlan ?? null}
        pending={pending}
        error={assignError}
        onSubmit={submitAssign}
      />
    </div>
  )
}
