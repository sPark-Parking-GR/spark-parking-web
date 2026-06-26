'use client'

import { useActionState } from 'react'
import { Spinner } from './Spinner'
import { checkInAction, checkOutAction } from '@/lib/booking-actions'
import type { BookingActionResult } from '@/lib/booking-actions'

type Kind = 'check-in' | 'check-out'

const INITIAL: BookingActionResult | null = null

export function BookingActionButton({ id, kind }: { id: string; kind: Kind }) {
  const action = kind === 'check-in' ? checkInAction : checkOutAction
  const [state, formAction, isPending] = useActionState(
    async (_prev: BookingActionResult | null, formData: FormData) => action(formData),
    INITIAL,
  )

  const label = kind === 'check-in' ? 'Check in' : 'Check out'
  const className = kind === 'check-in' ? 'btn btn--primary' : 'btn btn--secondary'

  return (
    <form action={formAction} className="booking-action">
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={className} disabled={isPending}>
        {isPending ? (
          <>
            <Spinner size={15} />
            Working…
          </>
        ) : (
          label
        )}
      </button>
      {state && !state.ok ? (
        <span className="booking-action__error" role="alert">
          {state.error}
        </span>
      ) : null}
    </form>
  )
}
