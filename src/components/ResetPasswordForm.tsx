'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { resetPasswordAction } from '@/lib/password-reset-actions'

type ResetPasswordState = { error: string | null; invalidToken: boolean }

const INITIAL_STATE: ResetPasswordState = { error: null, invalidToken: false }

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations('resetPassword')

  const [state, formAction, isPending] = useActionState(
    async (_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> => {
      const passwordSchema = z
        .object({
          password: z.string().min(8, t('passwordTooShort')).max(128, t('passwordTooLong')),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('passwordsMismatch'),
          path: ['confirmPassword'],
        })

      const parsed = passwordSchema.safeParse({
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
      })

      if (!parsed.success) {
        return {
          error: parsed.error.issues[0]?.message ?? t('genericError'),
          invalidToken: false,
        }
      }

      const result = await resetPasswordAction(token, { password: parsed.data.password })
      return { error: t(result.errorKey), invalidToken: result.errorKey === 'invalidToken' }
    },
    INITIAL_STATE,
  )

  if (state.invalidToken) {
    return (
      <div className="auth-form">
        <p className="auth-alert" role="alert">
          {state.error}
        </p>
        <p className="auth-card__forgot">
          <Link href="/forgot-password">{t('requestNewLink')}</Link>
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="auth-form" noValidate>
      <label className="field">
        <span className="field__label">{t('passwordLabel')}</span>
        <input
          className="input"
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          disabled={isPending}
          aria-invalid={state.error ? true : undefined}
        />
      </label>

      <label className="field">
        <span className="field__label">{t('confirmPasswordLabel')}</span>
        <input
          className="input"
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          autoComplete="new-password"
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
    </form>
  )
}
