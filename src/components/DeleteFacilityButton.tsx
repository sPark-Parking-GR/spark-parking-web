'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { deleteFacilityAction } from '@/lib/facility-actions'

interface Props {
  id: string
}

function ConfirmButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--danger-solid" disabled={pending}>
      {pending ? (
        <>
          <Spinner size={15} />
          Deleting…
        </>
      ) : (
        'Delete facility'
      )}
    </button>
  )
}

export function DeleteFacilityButton({ id }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="btn btn--icon btn--ghost-danger"
        onClick={() => setOpen(true)}
        aria-label="Delete facility"
        data-tooltip="Delete facility"
        data-tooltip-pos="bottom"
      >
        <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Delete facility">
        <p className="modal__text">
          This permanently removes the facility and its configuration. This action cannot be undone.
        </p>
        <form action={deleteFacilityAction} className="modal__footer">
          <input type="hidden" name="id" value={id} />
          <button type="button" className="btn btn--secondary" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <ConfirmButton />
        </form>
      </Modal>
    </>
  )
}
