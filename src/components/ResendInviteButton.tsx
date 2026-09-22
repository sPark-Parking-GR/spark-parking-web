'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Spinner } from './Spinner'
import { resendInviteAction } from '@/lib/invite-actions'
import type { ResendInviteResult } from '@/lib/invite-actions'

interface Props {
  id: string
}

const INITIAL_STATE: ResendInviteResult = { ok: true, delivered: true }

function TriggerButton() {
  const t = useTranslations('onboarding')
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--sm btn--secondary" disabled={pending}>
      {pending ? (
        <>
          <Spinner size={14} />
          {t('resend.sending')}
        </>
      ) : (
        t('resend.trigger')
      )}
    </button>
  )
}

export function ResendInviteButton({ id }: Props) {
  const t = useTranslations('onboarding')
  const [state, formAction] = useActionState(resendInviteAction, INITIAL_STATE)

  // Resending mints a new token and destroys the old one, so a failed delivery here has
  // to be said out loud: the previous link is already dead either way.
  const message = !state.ok
    ? (state.detail ?? t(state.errorKey))
    : state.delivered
      ? null
      : t('resend.notDelivered')

  return (
    <form action={formAction} className="invite-resend">
      <input type="hidden" name="id" value={id} />
      <TriggerButton />
      {message ? (
        <span className="invite-resend__message" role="alert">
          {message}
        </span>
      ) : null}
    </form>
  )
}
