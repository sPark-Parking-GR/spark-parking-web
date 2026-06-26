'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { deleteTariffPlanAction } from '@/lib/tariff-actions'

interface Props {
  facilityId: string
  planId: string
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
        'Delete plan'
      )}
    </button>
  )
}

export function DeleteTariffButton({ facilityId, planId }: Props) {
  const [open, setOpen] = useState(false)
  const boundAction = deleteTariffPlanAction.bind(null, facilityId, planId)

  return (
    <>
      <button
        type="button"
        className="btn btn--icon btn--ghost-danger"
        onClick={() => setOpen(true)}
        aria-label="Delete tariff plan"
        data-tooltip="Delete plan"
        data-tooltip-pos="bottom"
      >
        <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Delete tariff plan">
        <p className="modal__text">
          This permanently removes the tariff plan and its pricing. This action cannot be undone.
        </p>
        <form action={boundAction} className="modal__footer">
          <button type="button" className="btn btn--secondary" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <ConfirmButton />
        </form>
      </Modal>
    </>
  )
}
