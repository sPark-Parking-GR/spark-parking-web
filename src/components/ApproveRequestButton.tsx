'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { approveRequestAction } from '@/lib/lifecycle-actions'

interface Props {
  id: string
  resourceLabel: string
}

export function ApproveRequestButton({ id, resourceLabel }: Props) {
  const t = useTranslations('adminLifecycle.approvals.approve')
  const tCommon = useTranslations('adminLifecycle')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const result = await approveRequestAction(id)
      if (!result.ok) {
        setError(result.detail ?? tCommon(result.errorKey))
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button type="button" className="btn btn--sm btn--primary" onClick={() => setOpen(true)}>
        {t('trigger')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('modalTitle')}>
        <p className="modal__text">{t('body', { resource: resourceLabel })}</p>
        {error ? (
          <p className="form-banner form-banner--error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {tCommon('cancel')}
          </button>
          <button type="button" className="btn btn--primary" disabled={pending} onClick={submit}>
            {pending ? (
              <>
                <Spinner size={15} />
                {t('confirming')}
              </>
            ) : (
              t('confirm')
            )}
          </button>
        </div>
      </Modal>
    </>
  )
}
