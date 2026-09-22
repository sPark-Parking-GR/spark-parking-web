'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Archive } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { archiveOperatorPlanAction } from '@/lib/operator-plan-actions'

interface Props {
  planId: string
  planName: string
  subscribers: number
}

export function ArchivePlanButton({ planId, planName, subscribers }: Props) {
  const t = useTranslations('operatorPlans')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    setReason('')
    setError(null)
  }, [open])

  const trimmedReason = reason.trim()
  const reasonInvalid = trimmedReason.length > 0 && trimmedReason.length < 3

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const result = await archiveOperatorPlanAction(planId, trimmedReason || undefined)
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
      <button
        type="button"
        className="btn btn--icon btn--ghost"
        onClick={() => setOpen(true)}
        aria-label={t('archive.buttonLabel')}
        data-tooltip={t('archive.tooltip')}
        data-tooltip-pos="bottom"
      >
        <Archive size={18} strokeWidth={2} aria-hidden="true" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('archive.title', { name: planName })}
      >
        <p className="modal__text">
          {t('archive.body')}
          {subscribers > 0 ? <> {t('archive.subscribers', { count: subscribers })}</> : null}
        </p>

        <div className="field">
          <span className="field__label">{t('archive.reasonLabel')}</span>
          <textarea
            className="input input--textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('archive.reasonPlaceholder')}
            disabled={pending}
          />
          {reasonInvalid ? (
            <span className="field__error">{t('archive.reasonTooShort')}</span>
          ) : null}
        </div>

        {error ? (
          <div className="form-banner form-banner--error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {t('archive.cancel')}
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
                {t('archive.archiving')}
              </>
            ) : (
              t('archive.confirm')
            )}
          </button>
        </div>
      </Modal>
    </>
  )
}
