'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { signInAction } from '@/lib/auth-actions'

type LoginState = { error: string | null }

const INITIAL_STATE: LoginState = { error: null }

export function LoginForm({ from }: { from?: string }) {
  const t = useTranslations('login')
  // React 19 resets an uncontrolled form once its action resolves, so a wrong password
  // used to wipe the address too and make the retry a full re-type. Controlling the email
  // keeps it; the password is deliberately left uncontrolled, since clearing that one on a
  // failed sign-in is the behaviour people expect.
  const [email, setEmail] = useState('')

  const [state, formAction, isPending] = useActionState(
    async (_prev: LoginState, formData: FormData): Promise<LoginState> => {
      const credentialsSchema = z.object({
        email: z.string().trim().email(t('emailInvalid')),
        password: z.string().min(1, t('passwordRequired')),
      })

      const parsed = credentialsSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
      })

      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? t('credentialsInvalid') }
      }

      const fromField = formData.get('from')
      const result = await signInAction(
        parsed.data,
        typeof fromField === 'string' ? fromField : undefined,
      )
      if (!result.ok) {
        return { error: t(result.errorKey) }
      }

      return { error: null }
    },
    INITIAL_STATE,
  )

  return (
    <form action={formAction} className="auth-form" noValidate>
      {from ? <input type="hidden" name="from" value={from} /> : null}

      <label className="field">
        <span className="field__label">{t('emailLabel')}</span>
        <input
          className="input"
          type="email"
          name="email"
          placeholder="admin@centralpark.gr"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={isPending}
          aria-invalid={state.error ? true : undefined}
        />
      </label>

      <label className="field">
        <span className="field__label">{t('passwordLabel')}</span>
        <input
          className="input"
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={isPending}
          aria-invalid={state.error ? true : undefined}
        />
      </label>

      {state.error ? (
        <p className="auth-alert" role="alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="btn btn--primary btn--block" disabled={isPending}>
        {isPending ? t('signingIn') : t('signIn')}
      </button>

      <p className="auth-card__forgot">
        <Link href="/forgot-password">{t('forgot')}</Link>
      </p>
    </form>
  )
}
