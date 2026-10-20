'use client'

import { useActionState, useId, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { AlertCircle, Eye, EyeOff, LockKeyhole, MailCheck } from 'lucide-react'
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
  const inputId = useId()
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [state, formAction, isPending] = useActionState(changePasswordAction, INITIAL_STATE)

  const sent = hasSubmitted && !isPending && state.ok
  const failed = hasSubmitted && !isPending && !state.ok

  if (sent) {
    return (
      <div className="pw-sent" role="status">
        <span className="pw-sent__icon" aria-hidden="true">
          <MailCheck size={22} strokeWidth={2} />
        </span>
        <div>
          <p className="pw-sent__title">{t('sentTitle')}</p>
          <p className="pw-sent__text">{t('confirmation')}</p>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} onSubmit={() => setHasSubmitted(true)} noValidate>
      <h4 className="pw-sub">{t('heading')}</h4>
      <p className="pw-sub__hint">{t('description')}</p>

      {failed && !state.ok ? (
        <p className="form-banner form-banner--error" role="alert">
          <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
          {/* A wrong password is always the translated line — `detail` is only ever set
              for a non-401 refusal, where the API's own message says more than "try
              again" can. */}
          {state.detail ?? t(state.errorKey)}
        </p>
      ) : null}

      <label className="field" htmlFor={inputId}>
        <span className="field__label">{t('currentPasswordLabel')}</span>
        <span className="pw-input">
          <LockKeyhole className="pw-input__lead" size={16} strokeWidth={2} aria-hidden="true" />
          {/* Uncontrolled, and never re-populated after a refusal: a rejected password is
              one the browser should be free to forget. */}
          <input
            id={inputId}
            className={`input pw-input__control${failed ? ' input--error' : ''}`}
            type={revealed ? 'text' : 'password'}
            name="currentPassword"
            autoComplete="current-password"
            required
            disabled={isPending}
            aria-invalid={failed ? true : undefined}
          />
          <button
            type="button"
            className="pw-input__toggle"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? t('hidePassword') : t('showPassword')}
            aria-pressed={revealed}
          >
            {revealed ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>
        </span>
      </label>

      <div className="form-actions">
        <SubmitButton />
      </div>
    </form>
  )
}
