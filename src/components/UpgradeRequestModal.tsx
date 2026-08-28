'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { requestUpgradeAction } from '@/lib/operator-subscription-actions'
import type { OperatorPlanSummary } from '@/lib/operator-subscription-api'

interface Props {
  plan: OperatorPlanSummary | null
  onClose: () => void
}

export function UpgradeRequestModal({ plan, onClose }: Props) {
  const t = useTranslations('billing')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!plan) return
    setMessage('')
    setError(null)
    setSent(false)
  }, [plan])

  if (!plan) return null

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const result = await requestUpgradeAction(plan.id, message)
      if (!result.ok) {
        setError(result.detail ?? t(result.errorKey))
        return
      }
      setSent(true)
    })
  }

  return (
    <Modal open onClose={onClose} title={t('upgrade.title', { plan: plan.name })}>
      {sent ? (
        <>
          <p className="form-banner form-banner--success" role="status">
            <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
            {t('upgrade.sent')}
          </p>
          <p className="modal__text">{t('upgrade.sentDetail')}</p>
          <div className="modal__footer">
            <button type="button" className="btn btn--primary" onClick={onClose}>
              {t('upgrade.done')}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="modal__text">{t('upgrade.body')}</p>

          <div className="field">
            <span className="field__label">{t('upgrade.messageLabel')}</span>
            <textarea
              className="input input--textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('upgrade.messagePlaceholder')}
              disabled={pending}
            />
          </div>

          {error ? (
            <div className="form-banner form-banner--error" role="alert">
              <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
              {error}
            </div>
          ) : null}

          <div className="modal__footer">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={pending}
            >
              {t('upgrade.cancel')}
            </button>
            <button type="button" className="btn btn--primary" disabled={pending} onClick={submit}>
              {pending ? (
                <>
                  <Spinner size={15} />
                  {t('upgrade.sending')}
                </>
              ) : (
                t('upgrade.submit')
              )}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
