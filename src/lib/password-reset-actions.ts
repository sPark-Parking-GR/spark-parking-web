'use server'

import { z } from 'zod'
import { PASSWORD_MAX, PASSWORD_MIN } from '@spark/types'
import { emailField } from '@/lib/email-schema'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://127.0.0.1:3001/api/v1'

const forgotPasswordSchema = z.object({
  email: emailField(),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(PASSWORD_MIN).max(PASSWORD_MAX),
})

export type ForgotPasswordResult =
  { ok: true } | { ok: false; errorKey: 'genericError' | 'tooManyAttempts' }

export async function forgotPasswordAction(input: {
  email: string
}): Promise<ForgotPasswordResult> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errorKey: 'genericError' }
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    })
    if (response.status === 429) {
      return { ok: false, errorKey: 'tooManyAttempts' }
    }
    if (!response.ok) {
      return { ok: false, errorKey: 'genericError' }
    }
  } catch {
    return { ok: false, errorKey: 'genericError' }
  }

  return { ok: true }
}

export type ResetPasswordResult =
  { ok: true } | { ok: false; errorKey: 'invalidToken' | 'genericError' | 'tooManyAttempts' }

export async function resetPasswordAction(
  token: string,
  input: { password: string },
): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse({ token, password: input.password })
  if (!parsed.success) {
    return { ok: false, errorKey: 'invalidToken' }
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    })
  } catch {
    return { ok: false, errorKey: 'genericError' }
  }

  // The API answers 400 for an unknown, expired or already-used token alike (on purpose, so
  // the endpoint cannot confirm which tokens were ever real), so those cannot be told apart.
  if (response.status === 429) return { ok: false, errorKey: 'tooManyAttempts' }
  if (response.status >= 500) return { ok: false, errorKey: 'genericError' }
  if (!response.ok) return { ok: false, errorKey: 'invalidToken' }

  return { ok: true }
}
