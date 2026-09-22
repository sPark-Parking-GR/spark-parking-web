'use client'

import { useEffect, useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { DefaultReplacementModal } from './DefaultReplacementModal'
import { deleteTariffPlanAction, getTariffAssignmentsAction } from '@/lib/tariff-actions'
import type { TariffPlanListItem } from '@/lib/tariff-api'

interface Props {
  planId: string
  plans?: TariffPlanListItem[]
}

export function DeleteTariffButton({ planId, plans }: Props) {
  const t = useTranslations('tariffs.delete')
  const tTariffs = useTranslations('tariffs')
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [requiresReplacement, setRequiresReplacement] = useState(false)
  const [replacementError, setReplacementError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    setCount(null)
    setError(null)
    setRequiresReplacement(false)
    // WHY: assignment count reflects live facility→plan links, fetched fresh each
    // time the modal opens so the confirm copy can't show a stale number.
    getTariffAssignmentsAction(planId)
      .then((res) => setCount(res?.count ?? null))
      .catch(() => setCount(null))
  }, [open, planId])

  const candidates = (plans ?? [])
    .filter((p) => p.id !== planId && p.isActive && p.vehicleTypes.length === 0)
    .map((p) => ({ id: p.id, name: p.name }))

  const submit = (newDefaultPlanId?: string) => {
    setError(null)
    startTransition(async () => {
      const res = await deleteTariffPlanAction(planId, newDefaultPlanId)
      if (!res.ok) {
        const message = res.detail ?? tTariffs(res.errorKey)
        if (res.requiresDefaultReplacement) {
          setRequiresReplacement(true)
          setReplacementError(newDefaultPlanId ? message : null)
          return
        }
        setError(message)
        return
      }
    })
  }

  return (
    <>
      <button
        type="button"
        className="btn btn--icon btn--ghost-danger"
        onClick={() => setOpen(true)}
        aria-label={t('buttonLabel')}
        data-tooltip={t('tooltip')}
        data-tooltip-pos="bottom"
      >
        <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
      </button>

      <Modal open={open && !requiresReplacement} onClose={() => setOpen(false)} title={t('title')}>
        <p className="modal__text">
          {t('body')}
          {count !== null && count > 0 ? <> {t('affectedFacilities', { count })}</> : null}
        </p>
        {error ? (
          <div className="form-banner form-banner--error" role="alert">
            {error}
          </div>
        ) : null}
        <div className="modal__footer">
          <button type="button" className="btn btn--secondary" onClick={() => setOpen(false)}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className="btn btn--danger-solid"
            disabled={pending}
            onClick={() => submit(undefined)}
          >
            {pending ? (
              <>
                <Spinner size={15} />
                {t('deleting')}
              </>
            ) : (
              t('confirm')
            )}
          </button>
        </div>
      </Modal>

      <DefaultReplacementModal
        open={open && requiresReplacement}
        onClose={() => {
          setRequiresReplacement(false)
          setOpen(false)
        }}
        candidates={candidates}
        pending={pending}
        error={replacementError}
        onConfirm={(newDefaultPlanId) => submit(newDefaultPlanId)}
      />
    </>
  )
}
