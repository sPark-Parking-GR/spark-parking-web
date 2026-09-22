'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { requestOwnPasswordResetAction } from '@/lib/profile-actions'
import type { ResetLinkActionResult } from '@/lib/profile-actions'

const INITIAL_STATE: ResetLinkActionResult = { ok: true }

function SubmitButton() {
  const t = useTranslations('profile.forgotPassword')
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--secondary" disabled={pending}>
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
    <form action={formAction} onSubmit={() => setHasSubmitted(true)}>
      <section className="editor-section card">
        <div className="editor-section__head">
          <h3 className="h-heading">{t('heading')}</h3>
          <p className="text-secondary editor-section__hint">{t('description')}</p>
        </div>

        {/* Plain success or failure, unlike the logged-out page's deliberately uniform
            answer: this caller is signed in and asking about the one address they already
            know they own, so there is no account left to enumerate. */}
        {settled && state.ok ? (
          <p className="form-banner form-banner--success" role="status">
            <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
            {t('confirmation')}
          </p>
        ) : null}
        {settled && !state.ok ? (
          <p className="form-banner form-banner--error" role="alert">
            <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
            {t(state.errorKey)}
          </p>
        ) : null}

        <div className="form-actions">
          <SubmitButton />
        </div>
      </section>
    </form>
  )
}
