'use client'

import { useActionState, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { sendInviteAction } from '@/lib/invite-actions'
import type { SendInviteResult } from '@/lib/invite-actions'

const INITIAL_STATE: SendInviteResult = { ok: true }

function SubmitButton() {
  const t = useTranslations('onboarding')
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primary" disabled={pending}>
      {pending ? t('form.sending') : t('form.sendInvite')}
    </button>
  )
}

export function InviteForm() {
  const t = useTranslations('onboarding')
  const formRef = useRef<HTMLFormElement>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const [state, formAction, isPending] = useActionState(
    async (prev: SendInviteResult, formData: FormData) => {
      const result = await sendInviteAction(prev, formData)
      if (result.ok) formRef.current?.reset()
      return result
    },
    INITIAL_STATE,
  )

  return (
    <form ref={formRef} action={formAction} onSubmit={() => setHasSubmitted(true)} noValidate>
      <section className="editor-section card">
        <div className="editor-section__head">
          <h3 className="h-heading">{t('form.heading')}</h3>
        </div>

        {hasSubmitted && !isPending && !state.ok ? (
          <p className="form-banner form-banner--error" role="alert">
            <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
            {state.detail ?? t(state.errorKey)}
          </p>
        ) : null}
        {hasSubmitted && !isPending && state.ok ? (
          <p className="form-banner form-banner--success" role="status">
            <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
            {t('form.sent')}
          </p>
        ) : null}

        <div className="field-grid">
          <label className="field">
            <span className="field__label">{t('form.emailLabel')}</span>
            <input className="input" type="email" name="email" required disabled={isPending} />
          </label>
        </div>

        <div className="form-actions">
          <SubmitButton />
        </div>
      </section>
    </form>
  )
}
