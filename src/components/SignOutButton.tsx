'use client'

import { LogOut } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { signOutAction } from '@/lib/auth-actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className="btn btn--secondary signout-btn"
      disabled={pending}
      data-tooltip="End your session"
      aria-label="Exit"
    >
      <LogOut size={16} strokeWidth={2} aria-hidden="true" />
      <span className="signout-btn__label">{pending ? 'Exiting…' : 'Exit'}</span>
    </button>
  )
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton />
    </form>
  )
}
