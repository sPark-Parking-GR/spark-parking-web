'use client'

import { useFormStatus } from 'react-dom'
import { deleteFacilityAction } from '@/lib/facility-actions'

interface Props {
  id: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--secondary btn--danger" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete facility'}
    </button>
  )
}

export function DeleteFacilityButton({ id }: Props) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm('Delete this facility? This action cannot be undone.')) {
      e.preventDefault()
    }
  }

  return (
    <form action={deleteFacilityAction} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton />
    </form>
  )
}
