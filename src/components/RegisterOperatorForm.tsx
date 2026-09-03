'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { registerOperatorAction } from '@/lib/operator-registration-actions'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'
import { PASSWORD_MIN } from '@spark/types'

type RegisterState = { error: string | null; loginHint?: boolean }

const INITIAL_STATE: RegisterState = { error: null }

export function RegisterOperatorForm() {
  const t = useTranslations('registerOperator')
  const tPassword = useTranslations('password')
  // Same reasoning as LoginForm/SetPasswordForm: React 19 clears an uncontrolled form once
  // its action resolves, so the fields worth surviving a failed submit stay controlled.
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')

  const [state, formAction, isPending] = useActionState(
    async (_prev: RegisterState, formData: FormData): Promise<RegisterState> => {
      const result = await registerOperatorAction({
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
        confirmPassword: String(formData.get('confirmPassword') ?? ''),
        businessName: String(formData.get('businessName') ?? ''),
        displayName: String(formData.get('displayName') ?? ''),
      })
      return { error: t(result.errorKey), loginHint: result.loginHint }
    },
    INITIAL_STATE,
  )

  useEffect(() => {
    setPassword('')
  }, [state])

  return (
    <form action={formAction} className="auth-form" noValidate>
      <label className="field">
        <span className="field__label">{t('emailLabel')}</span>
        <input
          className="input"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={isPending}
          aria-invalid={state.error ? true : undefined}
        />
      </label>

      <label className="field">
        <span className="field__label">{t('businessNameLabel')}</span>
        <input
          className="input"
          type="text"
          name="businessName"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          required
          disabled={isPending}
          aria-invalid={state.error ? true : undefined}
        />
      </label>

      <label className="field">
        <span className="field__label">{t('yourNameLabel')}</span>
        <input
          className="input"
          type="text"
          name="displayName"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
          disabled={isPending}
          aria-invalid={state.error ? true : undefined}
        />
      </label>

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
          aria-describedby="register-password-hint"
        />
        <p id="register-password-hint" className="field__hint">
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
          {state.loginHint ? (
            <>
              {' '}
              <Link href="/login">{t('goToLogin')}</Link>
            </>
          ) : null}
        </p>
      ) : null}

      <button type="submit" className="btn btn--primary btn--block" disabled={isPending}>
        {isPending ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
