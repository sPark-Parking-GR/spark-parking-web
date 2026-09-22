'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { resetPasswordAction } from '@/lib/password-reset-actions'
import { PASSWORD_MAX, PASSWORD_MIN } from '@spark/types'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'

type ResetPasswordState = { error: string | null; invalidToken: boolean }

const INITIAL_STATE: ResetPasswordState = { error: null, invalidToken: false }

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations('resetPassword')
  const tPassword = useTranslations('password')
  const [password, setPassword] = useState('')

  const [state, formAction, isPending] = useActionState(
    async (_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> => {
      const passwordSchema = z
        .object({
          password: z
            .string()
            .min(PASSWORD_MIN, t('passwordTooShort'))
            .max(PASSWORD_MAX, t('passwordTooLong')),
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

  // Follows the input's own reset: React clears the field once the action resolves, so a
  // meter still describing the wiped value would be describing nothing on screen.
  useEffect(() => {
    setPassword('')
  }, [state])

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
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby="reset-password-hint"
        />
        <p id="reset-password-hint" className="field__hint">
          {tPassword('hint', { min: PASSWORD_MIN })}
        </p>
        <PasswordStrengthMeter password={password} />
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
