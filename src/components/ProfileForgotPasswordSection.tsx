'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { AlertCircle, MailCheck, Mail } from 'lucide-react'
import { requestOwnPasswordResetAction } from '@/lib/profile-actions'
import type { ResetLinkActionResult } from '@/lib/profile-actions'

const INITIAL_STATE: ResetLinkActionResult = { ok: true }

function SubmitButton() {
  const t = useTranslations('profile.forgotPassword')
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--secondary btn--sm" disabled={pending}>
      <Mail size={14} strokeWidth={2} aria-hidden="true" />
      {pending ? t('submitting') : t('submit')}
    </button>
  )
}

/**
 * The same reset link the logged-out page sends, for somebody who is signed in but cannot
 * produce their current password — which is the one case the change-password form above
 * cannot serve.
 *
 * No email field: the address comes from the session on the server. There is nothing to
 * type, so there is nothing to mistype and nothing to point at somebody else's mailbox.
 */
export function ProfileForgotPasswordSection() {
  const t = useTranslations('profile.forgotPassword')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [state, formAction, isPending] = useActionState(
    requestOwnPasswordResetAction,
    INITIAL_STATE,
  )

  const settled = hasSubmitted && !isPending

  return (
    <form
      action={formAction}
      onSubmit={() => setHasSubmitted(true)}
      className="pw-alt"
      aria-labelledby="pw-alt-title"
    >
      {/* Plain success or failure, unlike the logged-out page's deliberately uniform
          answer: this caller is signed in and asking about the one address they already
          know they own, so there is no account left to enumerate. */}
      {settled && state.ok ? (
        <div className="pw-sent" role="status">
          <span className="pw-sent__icon" aria-hidden="true">
            <MailCheck size={22} strokeWidth={2} />
          </span>
          <div>
            <p className="pw-sent__title">{t('sentTitle')}</p>
            <p className="pw-sent__text">{t('confirmation')}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="pw-alt__copy">
            <p id="pw-alt-title" className="pw-alt__title">
              {t('heading')}
            </p>
            <p className="pw-alt__text">{t('description')}</p>
            {settled && !state.ok ? (
              <p className="pw-alt__error" role="alert">
                <AlertCircle size={14} strokeWidth={2} aria-hidden="true" />
                {t(state.errorKey)}
              </p>
            ) : null}
          </div>
          <SubmitButton />
        </>
      )}
    </form>
  )
}
