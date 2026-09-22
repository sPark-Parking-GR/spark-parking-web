'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { restoreUserAction } from '@/lib/identity-actions'

interface Props {
  id: string
  icon?: ReactNode
  iconOnly?: boolean
}

export function RestoreUserButton({ id, icon, iconOnly }: Props) {
  const t = useTranslations('adminUsers.detail.restore')
  const tUsers = useTranslations('adminUsers')
  const tCommon = useTranslations('adminLifecycle')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const result = await restoreUserAction(id, reason.trim() || undefined)
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
          className="btn btn--icon btn--ghost-primary"
          onClick={() => setOpen(true)}
          aria-label={t('trigger')}
          data-tooltip={t('trigger')}
          data-tooltip-pos="bottom"
        >
          {icon}
        </button>
      ) : (
        <button type="button" className="btn btn--sm btn--secondary" onClick={() => setOpen(true)}>
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
