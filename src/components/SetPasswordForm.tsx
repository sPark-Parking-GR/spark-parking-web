'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { acceptInviteAction } from '@/lib/invite-actions'

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

  const [state, formAction, isPending] = useActionState(
    async (_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> => {
      const passwordSchema = z
        .object({
          password: z.string().min(8, t('passwordTooShort')).max(128, t('passwordTooLong')),
          confirmPassword: z.string(),
          businessName: requiresBusinessName
            ? z
                .string()
                .trim()
                .min(1, t('businessNameRequired'))
                .max(200, t('businessNameTooLong'))
            : z.string().trim().max(200, t('businessNameTooLong')).optional(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('passwordsMismatch'),
          path: ['confirmPassword'],
        })

      const parsed = passwordSchema.safeParse({
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        businessName: formData.get('businessName') ?? undefined,
      })

      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? t('genericError') }
      }

      const result = await acceptInviteAction(token, parsed.data)
      return { error: result.detail ?? t(result.errorKey), loginHint: result.loginHint }
    },
    INITIAL_STATE,
  )

  return (
    <form action={formAction} className="auth-form" noValidate>
      {requiresBusinessName ? (
        <label className="field">
          <span className="field__label">{t('businessNameLabel')}</span>
          <input
            className="input"
            type="text"
            name="businessName"
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
        />
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
