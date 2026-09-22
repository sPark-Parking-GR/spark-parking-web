'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { updateFacilityManagersAction } from '@/lib/facility-actions'
import { updateTariffPlanManagersAction } from '@/lib/tariff-actions'
import type { ManagersActionResult, ManagersResponse } from '@/lib/api'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const SYSTEM_BACKFILL = 'system:backfill'

interface Props {
  kind: 'facility' | 'tariffPlan'
  resourceId: string
  namespace: 'facilities' | 'tariffs'
  initial: ManagersResponse
  currentUserId: string
  isPlatformAdmin?: boolean
}

function saveManagers(
  kind: Props['kind'],
  resourceId: string,
  userIds: string[],
): Promise<ManagersActionResult> {
  return kind === 'facility'
    ? updateFacilityManagersAction(resourceId, userIds)
    : updateTariffPlanManagersAction(resourceId, userIds)
}

export function ManagersPanel({
  kind,
  resourceId,
  namespace,
  initial,
  currentUserId,
  isPlatformAdmin = false,
}: Props) {
  const t = useTranslations(namespace)
  const tRole = useTranslations('onboarding.detail.members.roleOptions')
  const tMembers = useTranslations('onboarding.detail.members')
  const router = useRouter()

  const [managers, setManagers] = useState(initial.managers)
  const candidates = initial.candidates
  const candidateIds = useMemo(() => new Set(candidates.map((c) => c.userId)), [candidates])

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initial.managers.filter((m) => candidateIds.has(m.userId)).map((m) => m.userId)),
  )
  const [confirmSelfRemoval, setConfirmSelfRemoval] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const nameByUserId = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of candidates) map.set(c.userId, c.displayName ?? c.email)
    for (const m of managers) map.set(m.userId, m.displayName ?? m.email)
    return map
  }, [candidates, managers])

  function assignedMeta(manager: ManagersResponse['managers'][number]): string {
    const date = dateFmt.format(new Date(manager.assignedAt))
    if (manager.assignedBy === SYSTEM_BACKFILL) return t('managers.assignedBySystem', { date })
    if (manager.assignedBy === currentUserId) return t('managers.assignedByYou', { date })
    const name = nameByUserId.get(manager.assignedBy)
    return name
      ? t('managers.assignedByName', { date, name })
      : t('managers.assignedByUnknown', { date })
  }

  function openModal() {
    setSelected(new Set(managers.filter((m) => candidateIds.has(m.userId)).map((m) => m.userId)))
    setError(null)
    setConfirmSelfRemoval(false)
    setOpen(true)
  }

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const removesSelf =
    !isPlatformAdmin &&
    managers.some((m) => m.userId === currentUserId) &&
    !selected.has(currentUserId)

  function requestSave() {
    if (removesSelf && !confirmSelfRemoval) {
      setConfirmSelfRemoval(true)
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await saveManagers(kind, resourceId, Array.from(selected))
      if (!res.ok) {
        setError(res.detail ?? t(res.errorKey))
        setConfirmSelfRemoval(false)
        return
      }
      setManagers(res.data.managers)
      setOpen(false)
      setConfirmSelfRemoval(false)
      router.refresh()
    })
  }

  return (
    <section className="editor-section card">
      <div className="editor-section__head">
        <h3 className="h-heading">{t('managers.heading')}</h3>
        <p className="editor-section__hint">{t('managers.description')}</p>
      </div>

      {managers.length === 0 ? (
        <p className="text-secondary">{t('managers.emptyState')}</p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t('managers.columnMember')}</th>
                <th>{t('managers.columnRole')}</th>
                <th>{t('managers.columnAssigned')}</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((manager) => (
                <tr key={manager.userId}>
                  <td>
                    <div>{manager.displayName ?? manager.email}</div>
                    {manager.displayName ? (
                      <div className="text-secondary">{manager.email}</div>
                    ) : null}
                    {manager.userId === currentUserId ? (
                      <div className="text-secondary">{tMembers('selfNote')}</div>
                    ) : null}
                  </td>
                  <td className="text-secondary">
                    {manager.memberRole ? tRole(manager.memberRole) : t('managers.notAMember')}
                  </td>
                  <td className="text-secondary">{assignedMeta(manager)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        className="btn btn--secondary btn--sm"
        onClick={openModal}
        style={{ marginTop: 'var(--space-md)' }}
      >
        {t('managers.manageButton')}
      </button>

      <Modal
        open={open && !confirmSelfRemoval}
        onClose={() => setOpen(false)}
        title={t('managers.modalTitle')}
      >
        <p className="modal__text">{t('managers.modalDescription')}</p>

        {error ? (
          <div className="form-banner form-banner--error" role="alert">
            {error}
          </div>
        ) : null}

        {candidates.length === 0 ? (
          <p className="text-secondary">{t('managers.noCandidates')}</p>
        ) : (
          <div className="assign-rows">
            {candidates.map((candidate) => (
              <label key={candidate.userId} className="assign-row checkbox-label">
                <input
                  type="checkbox"
                  checked={selected.has(candidate.userId)}
                  onChange={() => toggle(candidate.userId)}
                  disabled={pending}
                />
                <span className="assign-row__field">
                  <span className="field__label">{candidate.displayName ?? candidate.email}</span>
                  {candidate.displayName ? (
                    <span className="text-secondary">{candidate.email}</span>
                  ) : null}
                </span>
                <span className="text-secondary">{tRole(candidate.memberRole)}</span>
              </label>
            ))}
          </div>
        )}

        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {t('managers.cancel')}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={pending || candidates.length === 0}
            onClick={requestSave}
          >
            {pending ? (
              <>
                <Spinner size={15} />
                {t('managers.saving')}
              </>
            ) : (
              t('managers.saveButton')
            )}
          </button>
        </div>
      </Modal>

      <Modal
        open={open && confirmSelfRemoval}
        onClose={() => setConfirmSelfRemoval(false)}
        title={t('managers.selfRemoveTitle')}
      >
        <p className="form-banner form-banner--warning" role="alert">
          <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />
          {t('managers.selfRemoveBody')}
        </p>

        {error ? (
          <div className="form-banner form-banner--error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setConfirmSelfRemoval(false)}
            disabled={pending}
          >
            {t('managers.selfRemoveBack')}
          </button>
          <button
            type="button"
            className="btn btn--danger-solid"
            disabled={pending}
            onClick={requestSave}
          >
            {pending ? (
              <>
                <Spinner size={15} />
                {t('managers.saving')}
              </>
            ) : (
              <>
                <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" />
                {t('managers.selfRemoveConfirm')}
              </>
            )}
          </button>
        </div>
      </Modal>
    </section>
  )
}
