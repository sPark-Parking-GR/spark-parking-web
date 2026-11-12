'use client'

import { useActionState, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, CircleCheck, Clock } from 'lucide-react'
import { PASSWORD_MAX, PASSWORD_MIN } from '@spark/types'
import { resetMobilePasswordAction } from '@/lib/mobile-reset-actions'
import { AuthBanner } from './AuthBanner'
import { AuthStatusPanel } from './AuthStatusPanel'
import { PasswordField } from './PasswordField'
import { Spinner } from './Spinner'

type ErrorKey = 'passwordTooShort' | 'passwordTooLong' | 'rateLimited' | 'genericError'

type FormState =
  { phase: 'idle' } | { phase: 'done' } | { phase: 'expired' } | { phase: 'error'; key: ErrorKey }

export type MobileResetPhase = FormState['phase']

const INITIAL_STATE: FormState = { phase: 'idle' }

export function MobileResetPasswordForm({
  token,
  onPhaseChange,
}: {
  token: string
  onPhaseChange: (phase: MobileResetPhase) => void
}) {
  const t = useTranslations('mobileResetPassword')
  const tPassword = useTranslations('password')
  const [password, setPassword] = useState('')

  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const next = String(formData.get('password') ?? '')

      if (next.length < PASSWORD_MIN) return { phase: 'error', key: 'passwordTooShort' }
      if (next.length > PASSWORD_MAX) return { phase: 'error', key: 'passwordTooLong' }

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

  useEffect(() => {
    onPhaseChange(state.phase)
  }, [state.phase, onPhaseChange])

  if (state.phase === 'done') {
    return (
      <AuthStatusPanel
        tone="ok"
        icon={<CircleCheck size={28} strokeWidth={1.75} />}
        message={t('successHint')}
      />
    )
  }

  if (state.phase === 'expired') {
    return (
      <AuthStatusPanel icon={<Clock size={28} strokeWidth={1.75} />} message={t('invalidToken')}>
        <p className="auth-card__context">{t('requestNewLink')}</p>
      </AuthStatusPanel>
    )
  }

  const errorKey = state.phase === 'error' ? state.key : null
  // Length problems belong to the field; the rest is about the request, so it gets a banner.
  const fieldError =
    errorKey === 'passwordTooShort' || errorKey === 'passwordTooLong' ? t(errorKey) : null
  const bannerError = errorKey !== null && fieldError === null ? t(errorKey) : null

  return (
    <form action={formAction} className="auth-form" noValidate>
      {bannerError ? <AuthBanner tone="warn">{bannerError}</AuthBanner> : null}

      <PasswordField
        id="mobile-reset-password"
        name="password"
        label={t('passwordLabel')}
        autoComplete="new-password"
        autoFocus
        disabled={isPending}
        value={password}
        onChange={setPassword}
        error={fieldError}
        hint={tPassword('hint', { min: PASSWORD_MIN })}
        showStrength
      />

      <button
        type="submit"
        className="btn btn--primary btn--block auth-submit"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? <Spinner size={16} /> : null}
        {isPending ? t('submitting') : t('submit')}
        {isPending ? null : <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />}
      </button>
    </form>
  )
}
