'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { acceptInviteAction } from '@/lib/invite-actions'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'
import { PASSWORD_MAX, PASSWORD_MIN } from '@spark/types'

type SetPasswordState = { error: string | null; loginHint?: boolean }

const INITIAL_STATE: SetPasswordState = { error: null }

export function SetPasswordForm({
  token,
  requiresBusinessName = false,
}: {
  token: string
  requiresBusinessName?: boolean
}) {
  const t = useTranslations('acceptInvite')
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
      const passwordSchema = z
        .object({
          password: z
            .string()
            .min(PASSWORD_MIN, t('passwordTooShort'))
            .max(PASSWORD_MAX, t('passwordTooLong')),
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
        .refine((data) => data.password === data.confirmPassword, {
          message: t('passwordsMismatch'),
          path: ['confirmPassword'],
        })

      const parsed = passwordSchema.safeParse({
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        businessName: formData.get('businessName') ?? undefined,
        displayName: formData.get('displayName'),
      })

      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? t('genericError') }
      }

      const result = await acceptInviteAction(token, parsed.data)
      return { error: result.detail ?? t(result.errorKey), loginHint: result.loginHint }
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
          aria-describedby="accept-password-hint"
        />
        <p id="accept-password-hint" className="field__hint">
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
