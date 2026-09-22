'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { cancelBookingAction } from '@/lib/booking-actions'
import type { BookingActionResult } from '@/lib/booking-actions'

interface Props {
  id: string
}

const INITIAL: BookingActionResult | null = null

function ConfirmButton() {
  const t = useTranslations('bookings')
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--danger-solid" disabled={pending}>
      {pending ? (
        <>
          <Spinner size={15} />
          {t('detail.cancel.cancelling')}
        </>
      ) : (
        t('detail.cancel.confirm')
      )}
    </button>
  )
}

export function CancelBookingButton({ id }: Props) {
  const t = useTranslations('bookings')
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(
    async (_prev: BookingActionResult | null, formData: FormData) => cancelBookingAction(formData),
    INITIAL,
  )

  useEffect(() => {
    if (state?.ok) setOpen(false)
  }, [state])

  return (
    <>
      <button type="button" className="btn btn--danger" onClick={() => setOpen(true)}>
        {t('detail.cancel.button')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('detail.cancel.modalTitle')}>
        <p className="modal__text">{t('detail.cancel.modalText')}</p>
        {state && !state.ok ? (
          <p className="form-banner form-banner--error" role="alert">
            {t(`errors.${state.errorKey}`)}
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
