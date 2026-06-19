'use client'

import { useFormStatus } from 'react-dom'
import { signOutAction } from '@/lib/auth-actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--secondary signout-btn" disabled={pending}>
      {pending ? 'Signing out…' : 'Sign out'}
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
