'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { clearSession, getSession, isDashboardRole, setSession } from './session'
import type { AuthResult } from '@spark/types'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://127.0.0.1:3001/api/v1'

const DASHBOARD_HOME = '/dashboard'
const LOGIN_PATH = '/login'

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export type SignInInput = z.infer<typeof signInSchema>

export type SignInResult = { ok: true } | { ok: false; error: string }

// Only same-origin absolute paths are honored. Protocol-relative (`//host`),
// backslash-smuggled (`/\host`) and non-rooted values fall back to the home page,
// closing the open-redirect vector on the `from` query param.
function safeReturnPath(from: string | undefined): string {
  if (!from || !from.startsWith('/')) return DASHBOARD_HOME
  if (from.startsWith('//') || from.startsWith('/\\')) return DASHBOARD_HOME
  return from
}

export async function signInAction(input: SignInInput, from?: string): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Enter a valid email and password.' }
  }

  let result: AuthResult
  try {
    const response = await fetch(`${BASE_URL}/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    })

    if (!response.ok) {
      return { ok: false, error: 'Invalid email or password.' }
    }

    result = (await response.json()) as AuthResult
  } catch {
    return { ok: false, error: 'Unable to sign in right now. Please try again.' }
  }

  if (!isDashboardRole(result.session.user.role)) {
    return { ok: false, error: 'This account is not authorized to access the dashboard.' }
  }

  await setSession({
    accessToken: result.session.accessToken,
    refreshToken: result.session.refreshToken,
    expiresAt: result.session.expiresAt,
    user: result.session.user,
  })

  redirect(safeReturnPath(from))
}

export async function signOutAction(): Promise<void> {
  const session = await getSession()
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

  await clearSession()
  redirect(LOGIN_PATH)
}
