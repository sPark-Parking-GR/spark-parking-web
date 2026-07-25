'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { reactivateOperatorAction } from '@/lib/operator-actions'
import type { OperatorActionResult } from '@/lib/operator-actions'

interface Props {
  id: string
}

const INITIAL_STATE: OperatorActionResult = { ok: true }

function ConfirmButton() {
  const t = useTranslations('onboarding')
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primary" disabled={pending}>
      {pending ? (
        <>
          <Spinner size={15} />
          {t('reactivate.reactivating')}
        </>
      ) : (
        t('reactivate.confirm')
      )}
    </button>
  )
}

export function ReactivateOperatorButton({ id }: Props) {
  const t = useTranslations('onboarding')
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(reactivateOperatorAction, INITIAL_STATE)

  return (
    <>
      <button type="button" className="btn btn--sm btn--secondary" onClick={() => setOpen(true)}>
        {t('reactivate.trigger')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('reactivate.modalTitle')}>
        <p className="modal__text">{t('reactivate.modalText')}</p>
        {!state.ok ? (
          <p className="form-banner form-banner--error" role="alert">
            {state.error}
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
