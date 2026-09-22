'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { forgotPasswordAction } from '@/lib/password-reset-actions'

type ForgotPasswordState = { error: string | null; submitted: boolean }

const INITIAL_STATE: ForgotPasswordState = { error: null, submitted: false }

export function ForgotPasswordForm() {
  const t = useTranslations('forgotPassword')

  const [state, formAction, isPending] = useActionState(
    async (_prev: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> => {
      const emailSchema = z.object({
        email: z.string().trim().email(t('emailInvalid')),
      })

      const parsed = emailSchema.safeParse({ email: formData.get('email') })
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? t('emailInvalid'), submitted: false }
      }

      const result = await forgotPasswordAction(parsed.data)
      if (!result.ok) {
        return { error: t(result.errorKey), submitted: false }
      }

      return { error: null, submitted: true }
    },
    INITIAL_STATE,
  )

  if (state.submitted) {
    return (
      <div className="auth-form">
        <p className="auth-card__context">{t('confirmation')}</p>
        <p className="auth-card__forgot">
          <Link href="/login">{t('backToLogin')}</Link>
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="auth-form" noValidate>
      <label className="field">
        <span className="field__label">{t('emailLabel')}</span>
        <input
          className="input"
          type="email"
          name="email"
          placeholder="admin@centralpark.gr"
          autoComplete="email"
          required
          disabled={isPending}
          aria-invalid={state.error ? true : undefined}
        />
      </label>

      {state.error ? (
        <p className="auth-alert" role="alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="btn btn--primary btn--block" disabled={isPending}>
        {isPending ? t('submitting') : t('submit')}
      </button>

      <p className="auth-card__forgot">
        <Link href="/login">{t('backToLogin')}</Link>
      </p>
    </form>
  )
}
