'use client'

import { useActionState } from 'react'
import { z } from 'zod'
import { signInAction } from '@/lib/auth-actions'

const credentialsSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

type LoginState = { error: string | null }

const INITIAL_STATE: LoginState = { error: null }

async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Enter a valid email and password.' }
  }

  const from = formData.get('from')
  const result = await signInAction(parsed.data, typeof from === 'string' ? from : undefined)
  if (!result.ok) {
    return { error: result.error }
  }

  return { error: null }
}

export function LoginForm({ from }: { from?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, INITIAL_STATE)

  return (
    <form action={formAction} className="auth-form" noValidate>
      {from ? <input type="hidden" name="from" value={from} /> : null}

      <label className="field">
        <span className="field__label">Email</span>
        <input
          className="input"
          type="email"
          name="email"
          autoComplete="email"
          required
          disabled={isPending}
          aria-invalid={state.error ? true : undefined}
        />
      </label>

      <label className="field">
        <span className="field__label">Password</span>
        <input
          className="input"
          type="password"
          name="password"
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
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
