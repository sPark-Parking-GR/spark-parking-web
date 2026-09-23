'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { acceptAdminInviteAction } from '@/lib/admin-invite-actions'
import { PASSWORD_MAX, PASSWORD_MIN } from '@spark/types'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'

type SetPasswordState = { error: string | null; loginHint?: boolean }

const INITIAL_STATE: SetPasswordState = { error: null }

export function SetAdminPasswordForm({
  token,
  requiresExistingPassword = false,
}: {
  token: string
  // True when this address already has a mobile-only sPark account: accepting attaches
  // this invite to it instead of creating a new one, so the form collects the EXISTING
  // password (verified by sign-in) rather than letting the person choose a new one.
  requiresExistingPassword?: boolean
}) {
  const t = useTranslations('adminInvites.accept')
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
        })
        .refine((data) => requiresExistingPassword || data.password === data.confirmPassword, {
          message: t('passwordsMismatch'),
          path: ['confirmPassword'],
        })

      const password = formData.get('password')
      const parsed = passwordSchema.safeParse({
        password,
        // No confirmation field is rendered for an existing password — nothing to mismatch.
        confirmPassword: requiresExistingPassword ? password : formData.get('confirmPassword'),
      })

      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? t('genericError') }
      }

      const result = await acceptAdminInviteAction(token, parsed.data)
      return { error: result.detail ?? t(result.errorKey), loginHint: result.loginHint }
    },
    INITIAL_STATE,
  )

  // Follows the input's own reset: React clears the field once the action resolves, so a
  // meter still describing the wiped value would be describing nothing on screen.
  useEffect(() => {
    setPassword('')
  }, [state])

  return (
    <form action={formAction} className="auth-form" noValidate>
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
          aria-describedby={requiresExistingPassword ? undefined : 'admin-password-hint'}
        />
        {requiresExistingPassword ? null : (
          <>
            <p id="admin-password-hint" className="field__hint">
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
