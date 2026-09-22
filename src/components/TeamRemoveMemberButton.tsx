'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { removeMemberAction } from '@/lib/team-actions'

interface Props {
  operatorId: string
  userId: string
  email: string
}

export function TeamRemoveMemberButton({ operatorId, userId, email }: Props) {
  const t = useTranslations('team')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const result = await removeMemberAction(operatorId, userId)
      if (!result.ok) {
        setError(result.detail ?? t(result.errorKey))
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button type="button" className="btn btn--sm btn--danger" onClick={() => setOpen(true)}>
        {t('remove.trigger')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('remove.modalTitle')}>
        <p className="modal__text">{t('remove.body', { email })}</p>

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
            {t('cancel')}
          </button>
          <button
            type="button"
            className="btn btn--danger-solid"
            disabled={pending}
            onClick={submit}
          >
            {pending ? (
              <>
                <Spinner size={15} />
                {t('remove.confirming')}
              </>
            ) : (
              t('remove.confirm')
            )}
          </button>
        </div>
      </Modal>
    </>
  )
}
