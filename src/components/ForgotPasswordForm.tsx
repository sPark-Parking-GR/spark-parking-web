'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Mail } from 'lucide-react'
import { AuthBanner } from '@/components/AuthBanner'
import { FloatingInput } from '@/components/FloatingInput'
import { Spinner } from '@/components/Spinner'
import { peekAuthEmail, stashAuthEmail } from '@/lib/auth-handoff'
import { emailField } from '@/lib/email-schema'
import { forgotPasswordAction } from '@/lib/password-reset-actions'

type ForgotPasswordState = { error: string | null }

const INITIAL_STATE: ForgotPasswordState = { error: null }

export function ForgotPasswordForm({ onSent }: { onSent: (email: string) => void }) {
  const t = useTranslations('forgotPassword')
  const emailRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  // An address typed on the sign-in page arrives already filled, so the person only has to
  // press Enter; with nothing handed over, the cursor starts in the field instead.
  useEffect(() => {
    const handedOver = peekAuthEmail()
    if (handedOver) {
      setEmail(handedOver)
      submitRef.current?.focus()
    } else {
      emailRef.current?.focus()
    }
  }, [])

  const validate = (value: string): string | null => {
    const parsed = emailField(t('emailInvalid')).safeParse(value)
    if (parsed.success) {
      setEmailError(null)
      return parsed.data
    }
    setEmailError(parsed.error.issues[0]?.message ?? t('emailInvalid'))
    return null
  }

  const [state, formAction, isPending] = useActionState(
    async (_prev: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> => {
      const address = validate(String(formData.get('email') ?? ''))
      if (address === null) {
        emailRef.current?.focus()
        return { error: null }
      }

      const result = await forgotPasswordAction({ email: address })
      if (!result.ok) return { error: t(result.errorKey) }

      stashAuthEmail(address)
      onSent(address)
      return { error: null }
    },
    INITIAL_STATE,
  )

  return (
    <form action={formAction} className="auth-form" noValidate>
      <div className="field">
        <FloatingInput
          ref={emailRef}
          id="forgot-email"
          label={t('emailLabel')}
          icon={<Mail size={18} strokeWidth={2} />}
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          disabled={isPending}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (emailError) setEmailError(null)
          }}
          onBlur={() => {
            if (email.length > 0) validate(email)
          }}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? 'forgot-email-error' : undefined}
        />
        {emailError ? (
          <p id="forgot-email-error" className="field__error auth-field-error" role="alert">
            {emailError}
          </p>
        ) : null}
      </div>

      {state.error ? <AuthBanner tone="warn">{state.error}</AuthBanner> : null}

      <button
        ref={submitRef}
        type="submit"
        className="btn btn--primary btn--block auth-submit"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? <Spinner size={16} /> : null}
        {isPending ? t('submitting') : t('submit')}
      </button>

      <p className="auth-card__forgot">
        <Link href="/login">{t('backToLogin')}</Link>
      </p>
    </form>
  )
}
