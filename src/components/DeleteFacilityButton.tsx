'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { deleteFacilityAction } from '@/lib/facility-actions'

interface Props {
  id: string
}

function ConfirmButton() {
  const t = useTranslations('facilities')
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--danger-solid" disabled={pending}>
      {pending ? (
        <>
          <Spinner size={15} />
          {t('delete.deleting')}
        </>
      ) : (
        t('delete.confirm')
      )}
    </button>
  )
}

export function DeleteFacilityButton({ id }: Props) {
  const t = useTranslations('facilities')
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="btn btn--icon btn--ghost-danger"
        onClick={() => setOpen(true)}
        aria-label={t('delete.ariaLabel')}
        data-tooltip={t('delete.ariaLabel')}
        data-tooltip-pos="bottom"
      >
        <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('delete.modalTitle')}>
        <p className="modal__text">{t('delete.modalText')}</p>
        <form action={deleteFacilityAction} className="modal__footer">
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
