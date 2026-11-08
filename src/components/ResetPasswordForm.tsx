'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { PASSWORD_MAX, PASSWORD_MIN } from '@spark/types'
import { AuthBanner } from '@/components/AuthBanner'
import { PasswordField } from '@/components/PasswordField'
import { Spinner } from '@/components/Spinner'
import { peekAuthEmail, stashAuthEmail } from '@/lib/auth-handoff'
import { resetPasswordAction } from '@/lib/password-reset-actions'

type ResetPasswordState = {
  error: string | null
  fieldError: string | null
  invalidToken: boolean
}

const INITIAL_STATE: ResetPasswordState = { error: null, fieldError: null, invalidToken: false }

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations('resetPassword')
  const tPassword = useTranslations('password')
  const router = useRouter()
  const passwordRef = useRef<HTMLInputElement>(null)
  const [password, setPassword] = useState('')
  // The reset link carries no address and the API has no way to look one up from it, so the
  // address is only known when this browser tab requested the link; otherwise the hidden
  // username field is left out rather than sent empty.
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    setEmail(peekAuthEmail())
  }, [])

  const [state, formAction, isPending] = useActionState(
    async (_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> => {
      const parsed = z
        .string()
        .min(PASSWORD_MIN, t('passwordTooShort'))
        .max(PASSWORD_MAX, t('passwordTooLong'))
        .safeParse(formData.get('password'))

      if (!parsed.success) {
        passwordRef.current?.focus()
        return {
          error: null,
          fieldError: parsed.error.issues[0]?.message ?? t('genericError'),
          invalidToken: false,
        }
      }

      const result = await resetPasswordAction(token, { password: parsed.data })
      if (!result.ok) {
        return {
          error: t(result.errorKey),
          fieldError: null,
          invalidToken: result.errorKey === 'invalidToken',
        }
      }

      if (email) stashAuthEmail(email)
      router.push('/login?reset=success')
      return INITIAL_STATE
    },
    INITIAL_STATE,
  )

  if (state.invalidToken) {
    return (
      <div className="auth-form">
        <AuthBanner>{t('invalidToken')}</AuthBanner>
        <Link href="/forgot-password" className="btn btn--primary btn--block auth-submit">
          {t('sendNewLink')}
        </Link>
        <p className="auth-card__forgot">
          <Link href="/login">{t('backToLogin')}</Link>
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="auth-form" noValidate>
      {email ? (
        <input
          type="text"
          name="email"
          autoComplete="username"
          value={email}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="auth-sr-only"
        />
      ) : null}

      <PasswordField
        ref={passwordRef}
        id="reset-password"
        name="password"
        label={t('passwordLabel')}
        autoComplete="new-password"
        autoFocus
        disabled={isPending}
        value={password}
        onChange={(value) => setPassword(value)}
        error={state.fieldError}
        hint={tPassword('hint', { min: PASSWORD_MIN })}
        showStrength
      />

      {state.error ? <AuthBanner tone="warn">{state.error}</AuthBanner> : null}

      <button
        type="submit"
        className="btn btn--primary btn--block auth-submit"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? <Spinner size={16} /> : null}
        {isPending ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
