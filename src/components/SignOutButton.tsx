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
      className="btn btn--secondary signout-btn"
      disabled={pending}
      data-tooltip={t('signOutTooltip')}
      aria-label={t('exit')}
    >
      <LogOut size={16} strokeWidth={2} aria-hidden="true" />
      <span className="signout-btn__label">{pending ? t('exiting') : t('exit')}</span>
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
