'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { acceptInviteAction } from '@/lib/invite-actions'
import { LegalConsent } from './LegalConsent'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'
import { readLegalFields } from '@/lib/legal-schema'
import { PASSWORD_MAX, PASSWORD_MIN, type LegalVersions } from '@spark/types'

type SetPasswordState = { error: string | null; loginHint?: boolean }

const INITIAL_STATE: SetPasswordState = { error: null }

export function SetPasswordForm({
  token,
  versions,
  requiresBusinessName = false,
  requiresExistingPassword = false,
  onAcceptSuccess,
}: {
  token: string
  versions: LegalVersions
  requiresBusinessName?: boolean
  // True when this address already has a mobile-only sPark account: accepting attaches
  // this invite to it instead of creating a new one, so the form collects the EXISTING
  // password (verified by sign-in) rather than letting the person choose a new one.
  requiresExistingPassword?: boolean
  onAcceptSuccess: (redirectTo: string) => void
}) {
  const t = useTranslations('acceptInvite')
  const tLegal = useTranslations('legal')
  // React 19 resets an uncontrolled form once its action resolves, which meant a mistyped
  // confirmation cost the invitee their business name and both passwords. The name is the
  // one worth keeping: retyping a password after a mismatch is expected, retyping the
  // company you already entered is not.
  const [businessName, setBusinessName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const tPassword = useTranslations('password')
  const [password, setPassword] = useState('')

  const [state, formAction, isPending] = useActionState(
    async (_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> => {
      // An existing password is verified by sign-in server-side, not chosen here — no
      // strength floor and no confirmation field to match against.
      const passwordField = requiresExistingPassword
        ? z.string().min(1, t('passwordRequired'))
        : z
            .string()
            .min(PASSWORD_MIN, t('passwordTooShort'))
            .max(PASSWORD_MAX, t('passwordTooLong'))

      const passwordSchema = z
        .object({
          password: passwordField,
          confirmPassword: z.string(),
          businessName: requiresBusinessName
            ? z.string().trim().min(1, t('businessNameRequired')).max(200, t('businessNameTooLong'))
            : z.string().trim().max(200, t('businessNameTooLong')).optional(),
          // Asked of everyone, including staff, who previously got no name at all and
          // showed up as a bare email address wherever people are listed.
          displayName: z
            .string()
            .trim()
            .min(1, t('yourNameRequired'))
            .max(120, t('yourNameTooLong')),
        })
        .refine((data) => requiresExistingPassword || data.password === data.confirmPassword, {
          message: t('passwordsMismatch'),
          path: ['confirmPassword'],
        })

      const legal = readLegalFields(formData)
      if (!legal.legalAccepted) return { error: tLegal('required') }

      const password = formData.get('password')
      const parsed = passwordSchema.safeParse({
        password,
        // No confirmation field is rendered for an existing password — nothing to mismatch.
        confirmPassword: requiresExistingPassword ? password : formData.get('confirmPassword'),
        businessName: formData.get('businessName') ?? undefined,
        displayName: formData.get('displayName'),
      })

      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? t('genericError') }
      }

      const result = await acceptInviteAction(token, {
        ...parsed.data,
        businessName: parsed.data.businessName,
        legal,
      })
      if (!result.ok) {
        return { error: result.detail ?? t(result.errorKey), loginHint: result.loginHint }
      }
      onAcceptSuccess(result.redirectTo)
      return { error: null }
    },
    INITIAL_STATE,
  )

  // Follows the input's own reset: React clears the field once the action resolves, and a
  // meter still describing the wiped value would be describing nothing on screen.
  useEffect(() => {
    setPassword('')
  }, [state])

  return (
    <form action={formAction} className="auth-form" noValidate>
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

      {requiresBusinessName ? (
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
      ) : null}

      <label className="field">
        <span className="field__label">
          {requiresExistingPassword ? t('existingPasswordLabel') : t('passwordLabel')}
        </span>
        <input
          className="input"
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete={requiresExistingPassword ? 'current-password' : 'new-password'}
          required
          disabled={isPending}
          aria-invalid={state.error ? true : undefined}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby={requiresExistingPassword ? undefined : 'accept-password-hint'}
        />
        {requiresExistingPassword ? null : (
          <>
            <p id="accept-password-hint" className="field__hint">
              {tPassword('hint', { min: PASSWORD_MIN })}
            </p>
            <PasswordStrengthMeter password={password} />
          </>
        )}
      </label>

      {requiresExistingPassword ? null : (
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
      )}

      <LegalConsent versions={versions} disabled={isPending} />

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
