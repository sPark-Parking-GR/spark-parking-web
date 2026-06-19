'use client'

import { useFormStatus } from 'react-dom'
import { deleteTariffPlanAction } from '@/lib/tariff-actions'

interface Props {
  facilityId: string
  planId: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--secondary btn--danger" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete plan'}
    </button>
  )
}

export function DeleteTariffButton({ facilityId, planId }: Props) {
  const boundAction = deleteTariffPlanAction.bind(null, facilityId, planId)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm('Delete this tariff plan? This action cannot be undone.')) {
      e.preventDefault()
    }
  }

  return (
    <form action={boundAction} onSubmit={handleSubmit}>
      <SubmitButton />
    </form>
  )
}
