'use client'

import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import { PASSWORD_MAX, PASSWORD_MIN } from '@spark/types'
import { resetMobilePasswordAction } from '@/lib/mobile-reset-actions'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'

type ErrorKey =
  'passwordTooShort' | 'passwordTooLong' | 'passwordsMismatch' | 'rateLimited' | 'genericError'

type FormState =
  { phase: 'idle' } | { phase: 'done' } | { phase: 'expired' } | { phase: 'error'; key: ErrorKey }

const INITIAL_STATE: FormState = { phase: 'idle' }

export function MobileResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations('mobileResetPassword')
  const tPassword = useTranslations('password')
  const [password, setPassword] = useState('')

  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const next = String(formData.get('password') ?? '')
      const confirm = String(formData.get('confirmPassword') ?? '')

      if (next.length < PASSWORD_MIN) return { phase: 'error', key: 'passwordTooShort' }
      if (next.length > PASSWORD_MAX) return { phase: 'error', key: 'passwordTooLong' }
      if (next !== confirm) return { phase: 'error', key: 'passwordsMismatch' }

      const result = await resetMobilePasswordAction(token, next)
      switch (result.status) {
        case 'success':
          return { phase: 'done' }
        case 'invalidToken':
          return { phase: 'expired' }
        case 'rateLimited':
          return { phase: 'error', key: 'rateLimited' }
        case 'invalidPassword':
          return { phase: 'error', key: 'passwordTooShort' }
        case 'error':
          return { phase: 'error', key: 'genericError' }
      }
    },
    INITIAL_STATE,
  )

  if (state.phase === 'done') {
    return (
      <div className="auth-form">
        <p className="auth-alert" role="status">
          {t('success')}
        </p>
        <p className="field__hint">{t('successHint')}</p>
      </div>
    )
  }

  if (state.phase === 'expired') {
    return (
      <div className="auth-form">
        <p className="auth-alert" role="alert">
          {t('invalidToken')}
        </p>
        <p className="field__hint">{t('requestNewLink')}</p>
      </div>
    )
  }

  const error = state.phase === 'error' ? t(state.key) : null

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
          aria-invalid={error ? true : undefined}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby="mobile-reset-password-hint"
        />
        <p id="mobile-reset-password-hint" className="field__hint">
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
          aria-invalid={error ? true : undefined}
        />
      </label>

      {error ? (
        <p className="auth-alert" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn btn--primary btn--block" disabled={isPending}>
        {isPending ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
