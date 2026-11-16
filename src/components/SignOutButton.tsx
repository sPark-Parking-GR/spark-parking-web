'use client'

import { LogOut } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { signOutAction } from '@/lib/auth-actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('shell')
  return (
    <button
      type="submit"
      className="ds-ibtn ds-signout"
      disabled={pending}
      aria-busy={pending}
      aria-label={t('signOut')}
      data-tooltip={t('signOut')}
      data-tooltip-pos="bottom"
    >
      <LogOut size={20} strokeWidth={1.8} aria-hidden="true" />
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
