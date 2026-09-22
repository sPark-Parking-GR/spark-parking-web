'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { suspendOperatorAction } from '@/lib/operator-actions'
import type { OperatorActionResult } from '@/lib/operator-actions'

interface Props {
  id: string
  icon?: ReactNode
  iconOnly?: boolean
}

const INITIAL_STATE: OperatorActionResult = { ok: true }

function ConfirmButton() {
  const t = useTranslations('onboarding')
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--danger-solid" disabled={pending}>
      {pending ? (
        <>
          <Spinner size={15} />
          {t('suspend.suspending')}
        </>
      ) : (
        t('suspend.confirm')
      )}
    </button>
  )
}

export function SuspendOperatorButton({ id, icon, iconOnly }: Props) {
  const t = useTranslations('onboarding')
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(suspendOperatorAction, INITIAL_STATE)

  return (
    <>
      {iconOnly && icon ? (
        <button
          type="button"
          className="btn btn--icon btn--ghost-danger"
          onClick={() => setOpen(true)}
          aria-label={t('suspend.trigger')}
          data-tooltip={t('suspend.trigger')}
          data-tooltip-pos="bottom"
        >
          {icon}
        </button>
      ) : (
        <button type="button" className="btn btn--sm btn--danger" onClick={() => setOpen(true)}>
          {t('suspend.trigger')}
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('suspend.modalTitle')}>
        <p className="modal__text">{t('suspend.modalText')}</p>
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
