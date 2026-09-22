'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { revokeAdminInviteAction } from '@/lib/admin-invite-actions'
import type { RevokeAdminInviteResult } from '@/lib/admin-invite-actions'

interface Props {
  id: string
}

const INITIAL_STATE: RevokeAdminInviteResult = { ok: true }

function ConfirmButton() {
  const t = useTranslations('adminInvites')
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--danger-solid" disabled={pending}>
      {pending ? (
        <>
          <Spinner size={15} />
          {t('revoke.revoking')}
        </>
      ) : (
        t('revoke.confirm')
      )}
    </button>
  )
}

export function RevokeAdminInviteButton({ id }: Props) {
  const t = useTranslations('adminInvites')
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(revokeAdminInviteAction, INITIAL_STATE)

  return (
    <>
      <button type="button" className="btn btn--sm btn--danger" onClick={() => setOpen(true)}>
        {t('revoke.trigger')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('revoke.modalTitle')}>
        <p className="modal__text">{t('revoke.modalText')}</p>
        {!state.ok ? (
          <p className="form-banner form-banner--error" role="alert">
            {state.detail ?? t(state.errorKey)}
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
