'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { z } from 'zod'
import { PASSWORD_MAX, PASSWORD_MIN } from '@spark/types'
import { AuthBanner } from '@/components/AuthBanner'
import { PasswordField } from '@/components/PasswordField'
import { PasswordLengthMeter } from '@/components/PasswordLengthMeter'
import { PasswordRules } from '@/components/PasswordRules'
import { Stepper } from '@/components/profile/Stepper'
import { Spinner } from '@/components/Spinner'
import { peekAuthEmail, stashAuthEmail } from '@/lib/auth-handoff'
import { resetPasswordAction } from '@/lib/password-reset-actions'

type ResetPasswordState = {
  error: string | null
  fieldError: string | null
  invalidToken: boolean
}

const INITIAL_STATE: ResetPasswordState = { error: null, fieldError: null, invalidToken: false }

export function ResetPasswordForm({
  token,
  onInvalidToken,
}: {
  token: string
  onInvalidToken?: () => void
}) {
  const t = useTranslations('resetPassword')
  const router = useRouter()
  const passwordRef = useRef<HTMLInputElement>(null)
  // The field is disabled while the action runs and cannot take focus until it settles.
  const refocusPassword = useRef(false)
  const [password, setPassword] = useState('')
  // A field error belongs to the attempt that raised it; typing again retires it.
  const [clearedFor, setClearedFor] = useState<ResetPasswordState | null>(null)
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
        refocusPassword.current = true
        return {
          error: null,
          fieldError: parsed.error.issues[0]?.message ?? t('genericError'),
          invalidToken: false,
        }
      }

      const result = await resetPasswordAction(token, { password: parsed.data })
      if (!result.ok) {
        if (result.errorKey === 'invalidToken') onInvalidToken?.()
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

  useEffect(() => {
    if (isPending || !refocusPassword.current) return
    refocusPassword.current = false
    passwordRef.current?.focus()
  })

  if (state.invalidToken) {
    return (
      <div className="auth-form auth-check">
        <span className="auth-check__icon auth-check__icon--warn" aria-hidden="true">
          <Clock size={28} strokeWidth={1.75} />
        </span>
        <p className="auth-card__context" role="status">
          {t('invalidText')}
        </p>
        <Link href="/forgot-password" className="btn btn--primary btn--block auth-submit">
          {t('sendNewLink')}
          <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
        </Link>
        <p className="auth-card__forgot">
          <Link href="/login" className="auth-back">
            <ArrowLeft size={16} strokeWidth={2.25} aria-hidden="true" />
            {t('backToLogin')}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="auth-form" noValidate>
      {/* The emailed link is steps one and two done: the password was confirmed and the
          mailbox proved. Only the choice of a new one is left. */}
      <Stepper current={3} />

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
        onChange={(value) => {
          setPassword(value)
          setClearedFor(state)
        }}
        error={clearedFor === state ? null : state.fieldError}
      />
      <PasswordLengthMeter password={password} segmented />
      <PasswordRules password={password} />

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
