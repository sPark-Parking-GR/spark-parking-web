'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { changePasswordAction } from '@/lib/profile-actions'
import type { ChangePasswordActionResult } from '@/lib/profile-actions'

const INITIAL_STATE: ChangePasswordActionResult = { ok: true }

function SubmitButton() {
  const t = useTranslations('profile.changePassword')
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primary" disabled={pending}>
      {pending ? t('submitting') : t('submit')}
    </button>
  )
}

/**
 * Collects one thing: the password the account already has. The new one is set later, on
 * the emailed link — so this form never holds both halves at once, and a wrong guess here
 * costs an error rather than a password.
 */
export function ChangePasswordForm() {
  const t = useTranslations('profile.changePassword')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [state, formAction, isPending] = useActionState(changePasswordAction, INITIAL_STATE)

  const sent = hasSubmitted && !isPending && state.ok

  if (sent) {
    return (
      <section className="editor-section card">
        <div className="editor-section__head">
          <h3 className="h-heading">{t('heading')}</h3>
        </div>
        <p className="form-banner form-banner--success" role="status">
          <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
          {t('confirmation')}
        </p>
      </section>
    )
  }

  return (
    <form action={formAction} onSubmit={() => setHasSubmitted(true)} noValidate>
      <section className="editor-section card">
        <div className="editor-section__head">
          <h3 className="h-heading">{t('heading')}</h3>
          <p className="text-secondary editor-section__hint">{t('description')}</p>
        </div>

        {hasSubmitted && !isPending && !state.ok ? (
          <p className="form-banner form-banner--error" role="alert">
            <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
            {/* A wrong password is always the translated line — `detail` is only ever set
                for a non-401 refusal, where the API's own message says more than "try
                again" can. */}
            {state.detail ?? t(state.errorKey)}
          </p>
        ) : null}

        <div className="field-grid">
          <label className="field">
            <span className="field__label">{t('currentPasswordLabel')}</span>
            {/* Uncontrolled, and never re-populated after a refusal: a rejected password is
                one the browser should be free to forget. */}
            <input
              className="input"
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              required
              disabled={isPending}
              aria-invalid={hasSubmitted && !isPending && !state.ok ? true : undefined}
            />
          </label>
        </div>

        <div className="form-actions">
          <SubmitButton />
        </div>
      </section>
    </form>
  )
}
