'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, Check } from 'lucide-react'
import { z } from 'zod'
import { acceptAdminInviteAction } from '@/lib/admin-invite-actions'
import { PASSWORD_MAX, PASSWORD_MIN, type LegalVersions } from '@spark/types'
import { AuthBanner } from './AuthBanner'
import { FieldError } from './FieldError'
import { LegalConsent } from './LegalConsent'
import { PasswordField } from './PasswordField'
import { Spinner } from './Spinner'
import { readLegalFields } from '@/lib/legal-schema'

type SetPasswordState = {
  error: string | null
  passwordError: string | null
  legalError: string | null
  loginHint?: boolean
}

const INITIAL_STATE: SetPasswordState = { error: null, passwordError: null, legalError: null }
// How long the green "Account ready" state shows before the page exit starts.
const SUCCESS_HOLD_MS = 450

export function SetAdminPasswordForm({
  token,
  email,
  versions,
  requiresExistingPassword = false,
  onAcceptSuccess,
}: {
  token: string
  // Paired with the password by password managers; never sent anywhere.
  email: string
  versions: LegalVersions
  // True when this address already has a mobile-only sPark account: accepting attaches
  // this invite to it instead of creating a new one, so the form collects the EXISTING
  // password (verified by sign-in) rather than letting the person choose a new one.
  requiresExistingPassword?: boolean
  onAcceptSuccess: (redirectTo: string) => void
}) {
  const t = useTranslations('adminInvites.accept')
  const tPassword = useTranslations('password')
  const tLegal = useTranslations('legal')
  const mounted = useRef(true)
  const [password, setPassword] = useState('')
  const [succeeded, setSucceeded] = useState(false)
  const [dismissed, setDismissed] = useState<SetPasswordState | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const [state, formAction, isPending] = useActionState(
    async (_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> => {
      const passwordField = requiresExistingPassword
        ? z.string().min(1, t('passwordRequired'))
        : z
            .string()
            .min(PASSWORD_MIN, t('passwordTooShort'))
            .max(PASSWORD_MAX, t('passwordTooLong'))

      const legal = readLegalFields(formData)
      const parsed = z.object({ password: passwordField }).safeParse({
        password: formData.get('password'),
      })

      const passwordError = parsed.success ? null : (parsed.error.issues[0]?.message ?? null)
      const legalError = legal.legalAccepted ? null : tLegal('required')
      if (passwordError || legalError) {
        return { error: null, passwordError, legalError }
      }
      if (!parsed.success) return INITIAL_STATE

      const result = await acceptAdminInviteAction(token, { password: parsed.data.password, legal })
      if (!result.ok) {
        return {
          error: result.detail ?? t(result.errorKey),
          passwordError: null,
          legalError: null,
          loginHint: result.loginHint,
        }
      }

      setSucceeded(true)
      await new Promise((resolve) => setTimeout(resolve, SUCCESS_HOLD_MS))
      // The person left during the hold: do not redirect them back.
      if (!mounted.current) return INITIAL_STATE
      onAcceptSuccess(result.redirectTo)
      return INITIAL_STATE
    },
    INITIAL_STATE,
  )

  const shown = dismissed === state ? INITIAL_STATE : state

  return (
    <form action={formAction} className="auth-form" noValidate>
      {shown.error ? (
        <AuthBanner>
          <span>{shown.error}</span>
          {shown.loginHint ? (
            <span className="auth-alert__actions">
              <Link href="/login" className="auth-alert__link">
                {t('goToLogin')}
              </Link>
            </span>
          ) : null}
        </AuthBanner>
      ) : null}

      <input
        type="text"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="auth-sr-only"
      />

      <PasswordField
        id="admin-password"
        name="password"
        label={requiresExistingPassword ? t('existingPasswordLabel') : t('passwordLabel')}
        autoComplete={requiresExistingPassword ? 'current-password' : 'new-password'}
        autoFocus
        disabled={isPending}
        value={password}
        onChange={(value) => {
          setPassword(value)
          if (shown.passwordError) setDismissed(state)
        }}
        error={shown.passwordError}
        hint={requiresExistingPassword ? undefined : tPassword('hint', { min: PASSWORD_MIN })}
        showStrength={!requiresExistingPassword}
      />

      <LegalConsent
        versions={versions}
        disabled={isPending}
        invalid={Boolean(shown.legalError)}
        onCheckedChange={(checked) => {
          if (checked && shown.legalError) setDismissed(state)
        }}
        describedBy={shown.legalError ? 'admin-legal-error' : undefined}
      />
      {shown.legalError ? <FieldError id="admin-legal-error">{shown.legalError}</FieldError> : null}

      <button
        type="submit"
        className={`btn btn--primary btn--block auth-submit${succeeded ? ' auth-submit--done' : ''}`}
        disabled={isPending || succeeded}
        aria-busy={isPending && !succeeded}
      >
        {succeeded ? (
          <Check size={20} strokeWidth={2.6} aria-hidden="true" />
        ) : isPending ? (
          <Spinner size={16} />
        ) : null}
        {succeeded ? t('success') : isPending ? t('submitting') : t('submit')}
        {isPending || succeeded ? null : (
          <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
        )}
      </button>
    </form>
  )
}
