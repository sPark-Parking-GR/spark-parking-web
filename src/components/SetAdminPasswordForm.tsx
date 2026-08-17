'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { acceptAdminInviteAction } from '@/lib/admin-invite-actions'

type SetPasswordState = { error: string | null; loginHint?: boolean }

const INITIAL_STATE: SetPasswordState = { error: null }

export function SetAdminPasswordForm({ token }: { token: string }) {
  const t = useTranslations('adminInvites.accept')

  const [state, formAction, isPending] = useActionState(
    async (_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> => {
      const passwordSchema = z
        .object({
          password: z.string().min(8, t('passwordTooShort')).max(200, t('passwordTooLong')),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('passwordsMismatch'),
          path: ['confirmPassword'],
        })

      const parsed = passwordSchema.safeParse({
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
      })

      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? t('genericError') }
      }

      const result = await acceptAdminInviteAction(token, parsed.data)
      return { error: result.detail ?? t(result.errorKey), loginHint: result.loginHint }
    },
    INITIAL_STATE,
  )

  return (
    <form action={formAction} className="auth-form" noValidate>
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
