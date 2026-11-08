'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { clearAllSessions, establishSessions, getActiveSession, isDashboardRole } from './session'
import type { AuthResult } from '@spark/types'
import { emailField } from '@/lib/email-schema'
import { safeReturnPath } from '@/lib/safe-return-path'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://127.0.0.1:3001/api/v1'

const LOGIN_PATH = '/login'

const signInSchema = z.object({
  email: emailField(),
  password: z.string().min(1),
})

const rememberSchema = z.object({ remember: z.boolean().optional() }).nullish()

export type SignInInput = z.infer<typeof signInSchema>

export type SignInErrorKey =
  'credentialsInvalid' | 'invalidCredentials' | 'signInFailed' | 'notAuthorized' | 'tooManyAttempts'

export type SignInResult =
  { ok: true; redirectTo: string } | { ok: false; errorKey: SignInErrorKey; retryAfter?: number }

const SIGN_IN_TIMEOUT_MS = 20_000
const DEFAULT_RETRY_AFTER_SECONDS = 60
const MAX_RETRY_AFTER_SECONDS = 3600

function parseRetryAfter(header: string | null): number {
  const seconds = header === null ? Number.NaN : Number.parseInt(header, 10)
  if (!Number.isFinite(seconds) || seconds < 1) return DEFAULT_RETRY_AFTER_SECONDS
  return Math.min(seconds, MAX_RETRY_AFTER_SECONDS)
}

export async function signInAction(
  input: SignInInput,
  from?: string,
  options?: { remember?: boolean } | null,
): Promise<SignInResult> {
  // Server-action arguments are attacker-controlled; anything but a literal `true` is off.
  const rememberOption = rememberSchema.safeParse(options).data?.remember === true

  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errorKey: 'credentialsInvalid' }
  }

  let result: AuthResult
  try {
    const response = await fetch(`${BASE_URL}/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
      signal: AbortSignal.timeout(SIGN_IN_TIMEOUT_MS),
    })

    if (response.status === 429) {
      return {
        ok: false,
        errorKey: 'tooManyAttempts',
        retryAfter: parseRetryAfter(response.headers.get('Retry-After')),
      }
    }
    if (response.status >= 500) {
      return { ok: false, errorKey: 'signInFailed' }
    }
    if (!response.ok) {
      // 401/403 and any other 4xx stay one generic message: it must not reveal whether the
      // address exists or why the account was refused.
      return { ok: false, errorKey: 'invalidCredentials' }
    }

    result = (await response.json()) as AuthResult
  } catch {
    return { ok: false, errorKey: 'signInFailed' }
  }

  if (!isDashboardRole(result.session.user.role)) {
    return { ok: false, errorKey: 'notAuthorized' }
  }

  await establishSessions(
    {
      accessToken: result.session.accessToken,
      refreshToken: result.session.refreshToken,
      expiresAt: result.session.expiresAt,
      user: result.session.user,
    },
    { remember: rememberOption },
  )

  return { ok: true, redirectTo: safeReturnPath(from) }
}

export async function signOutAction(): Promise<void> {
  const session = await getActiveSession()
  const accessToken = session.accessToken

  if (accessToken) {
    try {
      await fetch(`${BASE_URL}/auth/sign-out`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      })
    } catch {
      // best-effort: clear the local session regardless of API outcome
    }
  }

  await clearAllSessions()
  redirect(LOGIN_PATH)
}
