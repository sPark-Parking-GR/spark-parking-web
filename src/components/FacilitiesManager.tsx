'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Power, PowerOff, Rocket, Trash2 } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { bulkFacilityAction } from '@/lib/facility-actions'
import { KIND_META, sourceLabel } from '@/lib/facility-display'
import { usePersistentSelection } from '@/lib/use-persistent-selection'
import type { AdminFacilityListItem, BulkFacilityAction } from '@/lib/api'

const SELECTION_KEY = 'facilities:selection'

interface Props {
  items: AdminFacilityListItem[]
}

const CONFIRMABLE: BulkFacilityAction[] = ['deploy', 'delete']

const CONFIRM_COPY: Record<
  'deploy' | 'delete',
  { title: string; body: (n: number) => string; cta: string; danger: boolean }
> = {
  deploy: {
    title: 'Deploy facilities',
    body: (n) =>
      `Activate and verify ${n} ${n === 1 ? 'facility' : 'facilities'}. They become visible in the mobile app immediately.`,
    cta: 'Deploy',
    danger: false,
  },
  delete: {
    title: 'Delete facilities',
    body: (n) =>
      `Deactivate ${n} ${n === 1 ? 'facility' : 'facilities'} and remove ${n === 1 ? 'it' : 'them'} from the mobile app. You can re-enable later.`,
    cta: 'Delete',
    danger: true,
  },
}

export function FacilitiesManager({ items }: Props) {
  const router = useRouter()
  const [selected, setSelected] = usePersistentSelection(SELECTION_KEY)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ action: 'deploy' | 'delete'; ids: string[] } | null>(
    null,
  )
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
        setError(res.error)
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
      setError('You can act on at most 500 facilities at once. Narrow your selection.')
      return
    }
    if (CONFIRMABLE.includes(action)) {
      setConfirm({ action: action as 'deploy' | 'delete', ids })
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

      {selected.size > 0 ? (
        <div className="bulk-bar" role="toolbar" aria-label="Bulk actions">
          <span className="bulk-bar__count">
            {selected.size} selected
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
              Deploy
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={pending}
              onClick={() => run('enable', selectedIds)}
            >
              <Power size={15} strokeWidth={2} aria-hidden="true" />
              Enable
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={pending}
              onClick={() => run('disable', selectedIds)}
            >
              <PowerOff size={15} strokeWidth={2} aria-hidden="true" />
              Disable
            </button>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              disabled={pending}
              onClick={() => run('delete', selectedIds)}
            >
              <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
              Delete
            </button>
          </div>
          <button
            type="button"
            className="bulk-bar__clear"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        </div>
      ) : null}

      <div className="table-wrapper">
        <table className="table table--sticky">
          <thead>
            <tr>
              <th className="table__check">
                <label className="checkbox-label" aria-label="Select all on this page">
                  <input
                    ref={headerCheck}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </label>
              </th>
              <th>Name</th>
              <th>Operator</th>
              <th>Kind</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Verified</th>
              <th className="table__actions-col" aria-label="Actions" />
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
                    <label className="checkbox-label" aria-label={`Select ${item.name}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(item.id)}
                      />
                    </label>
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/facilities/${item.id}`}
                      className="table-link"
                    >
                      {item.name}
                    </Link>
                    <span className="table__sub">{item.address}</span>
                  </td>
                  <td className="text-secondary">
                    {item.operatorName}
                    <span className="table__sub">{sourceLabel(item.source)}</span>
                  </td>
                  <td>
                    <span className={`badge ${kind.badge}`}>{kind.label}</span>
                  </td>
                  <td>
                    {item.onlineQuota}/{item.totalCapacity}
                  </td>
                  <td>
                    {item.isActive ? (
                      <span className="badge badge--success">Active</span>
                    ) : (
                      <span className="badge badge--neutral">Inactive</span>
                    )}
                  </td>
                  <td>
                    {item.isVerified ? (
                      <span className="badge badge--success">Verified</span>
                    ) : (
                      <span className="badge badge--warning">Pending</span>
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
                          aria-label="Deploy"
                          data-tooltip="Deploy (activate + verify)"
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
                          aria-label="Disable"
                          data-tooltip="Disable"
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
                          aria-label="Enable"
                          data-tooltip="Enable"
                          data-tooltip-pos="bottom"
                        >
                          <Power size={17} strokeWidth={2} aria-hidden="true" />
                        </button>
                      )}
                      <Link
                        href={`/dashboard/facilities/${item.id}`}
                        className="btn btn--icon btn--ghost"
                        aria-label="Edit"
                        data-tooltip="Edit"
                        data-tooltip-pos="bottom"
                      >
                        <Pencil size={16} strokeWidth={2} aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        className="btn btn--icon btn--ghost-danger"
                        disabled={pending}
                        onClick={() => run('delete', [item.id])}
                        aria-label="Delete"
                        data-tooltip="Delete"
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
            <p className="modal__text">
              {CONFIRM_COPY[confirm.action].body(confirm.ids.length)}
            </p>
            <div className="modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={
                  CONFIRM_COPY[confirm.action].danger
                    ? 'btn btn--danger-solid'
                    : 'btn btn--primary'
                }
                disabled={pending}
                onClick={() => execute(confirm.action, confirm.ids)}
              >
                {pending ? (
                  <>
                    <Spinner size={15} />
                    Working…
                  </>
                ) : (
                  CONFIRM_COPY[confirm.action].cta
                )}
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  )
}
