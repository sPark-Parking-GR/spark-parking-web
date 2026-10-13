'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import {
  eraseMobileUserAction,
  reactivateMobileUserAction,
  revokeMobileUserSessionsAction,
  suspendMobileUserAction,
} from '@/lib/mobile-user-actions'
import { MOBILE_REASON_MIN } from '@/lib/mobile-user-schema'
import type { MobileUserStatus } from '@/lib/mobile-user-schema'

type ActionKind = 'suspend' | 'reactivate' | 'revoke' | 'erase'

interface Props {
  id: string
  email: string
  status: MobileUserStatus
}

function availableActions(status: MobileUserStatus): ActionKind[] {
  switch (status) {
    case 'ACTIVE':
      return ['suspend', 'revoke', 'erase']
    case 'SUSPENDED':
      return ['reactivate', 'revoke', 'erase']
    case 'DEACTIVATED':
      return ['revoke', 'erase']
    case 'DELETED':
      return []
  }
}

export function MobileUserActions({ id, email, status }: Props) {
  const t = useTranslations('adminMobileUsers.detail.actions')
  const tErrors = useTranslations('adminMobileUsers')
  const tCommon = useTranslations('adminLifecycle')
  const router = useRouter()
  const [kind, setKind] = useState<ActionKind | null>(null)
  const [reason, setReason] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const actions = availableActions(status)
  if (actions.length === 0) return null

  const reasonInvalid = reason.trim().length < MOBILE_REASON_MIN
  const emailMismatch =
    kind === 'erase' && confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase()

  const close = () => {
    setKind(null)
    setReason('')
    setConfirmEmail('')
    setError(null)
  }

  const open = (next: ActionKind) => {
    setReason('')
    setConfirmEmail('')
    setError(null)
    setKind(next)
  }

  const submit = () => {
    if (!kind) return
    setError(null)
    startTransition(async () => {
      const trimmed = reason.trim()
      const result =
        kind === 'suspend'
          ? await suspendMobileUserAction(id, trimmed)
          : kind === 'reactivate'
            ? await reactivateMobileUserAction(id, trimmed)
            : kind === 'revoke'
              ? await revokeMobileUserSessionsAction(id, trimmed)
              : await eraseMobileUserAction(id, trimmed, confirmEmail)
      if (!result.ok) {
        setError(
          result.detail
            ? `${tErrors(result.errorKey)} (${result.detail})`
            : tErrors(result.errorKey),
        )
        return
      }
      close()
      router.refresh()
    })
  }

  return (
    <>
      <div className="row-actions">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            className={`btn btn--sm ${action === 'reactivate' ? 'btn--secondary' : 'btn--danger'}`}
            onClick={() => open(action)}
          >
            {t(`${action}.trigger`)}
          </button>
        ))}
      </div>

      {kind ? (
        <Modal open onClose={pending ? () => undefined : close} title={t(`${kind}.title`)}>
          <p className="modal__text">{t(`${kind}.text`, { email })}</p>

          {kind === 'erase' ? (
            <p className="form-banner form-banner--error" role="note">
              {t('erase.irreversible')}
            </p>
          ) : null}

          <div className="field">
            <span className="field__label">{tCommon('reasonLabel')}</span>
            <textarea
              className="input input--textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={tCommon('reasonPlaceholder')}
              maxLength={500}
              disabled={pending}
            />
            {reasonInvalid ? (
              <span className="field__error">{tCommon('validation.reasonRequired')}</span>
            ) : null}
          </div>

          {kind === 'erase' ? (
            <label className="field">
              <span className="field__label">{t('erase.confirmEmailLabel', { email })}</span>
              <input
                className="input"
                type="text"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                disabled={pending}
              />
            </label>
          ) : null}

          {error ? (
            <p className="form-banner form-banner--error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={close} disabled={pending}>
              {tCommon('cancel')}
            </button>
            <button
              type="button"
              className={kind === 'reactivate' ? 'btn btn--primary' : 'btn btn--danger-solid'}
              disabled={pending || reasonInvalid || emailMismatch}
              onClick={submit}
            >
              {pending ? (
                <>
                  <Spinner size={15} />
                  {t('confirming')}
                </>
              ) : (
                t(`${kind}.confirm`)
              )}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
