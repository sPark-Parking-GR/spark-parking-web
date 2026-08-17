'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { suspendUserAction } from '@/lib/identity-actions'

interface Props {
  id: string
  icon?: ReactNode
  iconOnly?: boolean
}

export function SuspendUserButton({ id, icon, iconOnly }: Props) {
  const t = useTranslations('adminUsers.detail.suspend')
  const tUsers = useTranslations('adminUsers')
  const tCommon = useTranslations('adminLifecycle')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const reasonInvalid = reason.trim().length < 3

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const result = await suspendUserAction(id, reason.trim())
      if (!result.ok) {
        setError(result.detail ?? tUsers(result.errorKey))
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      {iconOnly && icon ? (
        <button
          type="button"
          className="btn btn--icon btn--ghost-danger"
          onClick={() => setOpen(true)}
          aria-label={t('trigger')}
          data-tooltip={t('trigger')}
          data-tooltip-pos="bottom"
        >
          {icon}
        </button>
      ) : (
        <button type="button" className="btn btn--sm btn--danger" onClick={() => setOpen(true)}>
          {t('trigger')}
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('modalTitle')}>
        <p className="modal__text">{t('modalText')}</p>

        <div className="field">
          <span className="field__label">{t('reasonLabel')}</span>
          <textarea
            className="input input--textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={tCommon('reasonPlaceholder')}
            disabled={pending}
          />
          {reasonInvalid ? (
            <span className="field__error">{tCommon('validation.reasonRequired')}</span>
          ) : null}
        </div>

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
          <button
            type="button"
            className="btn btn--danger-solid"
            disabled={pending || reasonInvalid}
            onClick={submit}
          >
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
