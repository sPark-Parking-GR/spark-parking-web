'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { updateProfileAction } from '@/lib/profile-actions'
import type { ProfileActionResult } from '@/lib/profile-actions'

const INITIAL_STATE: ProfileActionResult = { ok: true }

function SubmitButton() {
  const t = useTranslations('profile')
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primary" disabled={pending}>
      {pending ? t('saving') : t('save')}
    </button>
  )
}

export function ProfileForm({ email, initialName }: { email: string; initialName: string }) {
  const t = useTranslations('profile')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  // Controlled so the field survives a refusal, and so the placeholder-vs-value distinction
  // stays honest: an empty box here means "no name", not "unchanged".
  const [displayName, setDisplayName] = useState(initialName)
  const [state, formAction, isPending] = useActionState(updateProfileAction, INITIAL_STATE)

  return (
    <form action={formAction} onSubmit={() => setHasSubmitted(true)} noValidate>
      <section className="editor-section card">
        <div className="editor-section__head">
          <h3 className="h-heading">{t('heading')}</h3>
        </div>

        {hasSubmitted && !isPending && state.ok ? (
          <p className="form-banner form-banner--success" role="status">
            <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
            {t('saved')}
          </p>
        ) : null}
        {hasSubmitted && !isPending && !state.ok ? (
          <p className="form-banner form-banner--error" role="alert">
            <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
            {state.detail ?? t(state.errorKey)}
          </p>
        ) : null}

        <div className="field-grid">
          <label className="field">
            <span className="field__label">{t('nameLabel')}</span>
            <input
              className="input"
              type="text"
              name="displayName"
              autoComplete="name"
              maxLength={120}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={isPending}
              aria-describedby="profile-name-hint"
            />
            <p id="profile-name-hint" className="field__hint">
              {t('nameHint', { email })}
            </p>
          </label>

          <label className="field">
            <span className="field__label">{t('emailLabel')}</span>
            {/* Read-only: changing the address is an identity-provider operation with its
                own verification, not a profile edit. */}
            <input className="input" type="email" value={email} disabled readOnly />
          </label>
        </div>

        <div className="form-actions">
          <SubmitButton />
        </div>
      </section>
    </form>
  )
}
