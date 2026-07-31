'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://127.0.0.1:3001/api/v1'

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
})

export type ForgotPasswordResult = { ok: true } | { ok: false; errorKey: 'genericError' }

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
    if (!response.ok) {
      return { ok: false, errorKey: 'genericError' }
    }
  } catch {
    return { ok: false, errorKey: 'genericError' }
  }

  return { ok: true }
}

export interface ResetPasswordResult {
  errorKey: 'invalidToken' | 'genericError'
}

export async function resetPasswordAction(
  token: string,
  input: { password: string },
): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse({ token, password: input.password })
  if (!parsed.success) {
    return { errorKey: 'invalidToken' }
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
    return { errorKey: 'genericError' }
  }

  if (!response.ok) {
    return { errorKey: 'invalidToken' }
  }

  redirect('/login?reset=success')
}
