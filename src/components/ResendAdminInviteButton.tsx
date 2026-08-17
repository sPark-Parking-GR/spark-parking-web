'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { resendAdminInviteAction } from '@/lib/admin-invite-actions'
import type { ResendAdminInviteResult } from '@/lib/admin-invite-actions'

interface Props {
  id: string
}

const INITIAL_STATE: ResendAdminInviteResult = { ok: true, delivered: true }

function ConfirmButton() {
  const t = useTranslations('adminInvites')
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primary" disabled={pending}>
      {pending ? (
        <>
          <Spinner size={15} />
          {t('resend.resending')}
        </>
      ) : (
        t('resend.confirm')
      )}
    </button>
  )
}

export function ResendAdminInviteButton({ id }: Props) {
  const t = useTranslations('adminInvites')
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(resendAdminInviteAction, INITIAL_STATE)

  return (
    <>
      <button type="button" className="btn btn--sm btn--secondary" onClick={() => setOpen(true)}>
        {t('resend.trigger')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('resend.modalTitle')}>
        <p className="modal__text">{t('resend.modalText')}</p>
        {!state.ok ? (
          <p className="form-banner form-banner--error" role="alert">
            {state.detail ?? t(state.errorKey)}
          </p>
        ) : null}
        {state.ok && !state.delivered ? (
          <p className="form-banner form-banner--warning" role="alert">
            {t('resend.notDelivered')}
          </p>
        ) : null}
        <form action={formAction} className="modal__footer">
          <input type="hidden" name="id" value={id} />
          <button type="button" className="btn btn--secondary" onClick={() => setOpen(false)}>
            {t('actions.cancel')}
          </button>
          <ConfirmButton />
        </form>
      </Modal>
    </>
  )
}
