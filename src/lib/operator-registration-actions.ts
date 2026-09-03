'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { establishSessions } from './session'
import type { AuthResult } from '@spark/types'
import { PASSWORD_MAX, PASSWORD_MIN } from '@spark/types'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://127.0.0.1:3001/api/v1'

export type RegisterAvailabilityResult = { enabled: boolean }

export type RegisterOperatorResult = {
  ok: false
  errorKey: string
  detail?: string
  loginHint?: boolean
}

const registerOperatorSchema = z
  .object({
    email: z.string().trim().email('emailInvalid'),
    password: z.string().min(PASSWORD_MIN, 'passwordTooShort').max(PASSWORD_MAX, 'passwordTooLong'),
    confirmPassword: z.string(),
    businessName: z.string().trim().min(2, 'businessNameRequired').max(200, 'businessNameTooLong'),
    displayName: z.string().trim().min(1, 'yourNameRequired').max(120, 'yourNameTooLong'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordsMismatch',
    path: ['confirmPassword'],
  })

// Lets the sign-up page know whether to render at all, so a closed platform shows an
// explanation rather than a form that always fails on submit.
export async function checkRegisterAvailabilityAction(): Promise<RegisterAvailabilityResult> {
  try {
    const response = await fetch(`${BASE_URL}/auth/register/operator/availability`, {
      cache: 'no-store',
    })
    if (!response.ok) return { enabled: false }
    return (await response.json()) as RegisterAvailabilityResult
  } catch {
    return { enabled: false }
  }
}

export async function registerOperatorAction(input: {
  email: string
  password: string
  confirmPassword: string
  businessName: string
  displayName: string
}): Promise<RegisterOperatorResult> {
  const parsed = registerOperatorSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errorKey: parsed.error.issues[0]?.message ?? 'genericError' }
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}/auth/register/operator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: parsed.data.email,
        password: parsed.data.password,
        businessName: parsed.data.businessName,
        displayName: parsed.data.displayName,
      }),
      cache: 'no-store',
    })
  } catch {
    return { ok: false, errorKey: 'unreachable' }
  }

  if (!response.ok) {
    if (response.status === 409) {
      // The address already has an account — genuinely taken, or a wrong password on one
      // that could have been linked. Either way, sign in is the right next step.
      return { ok: false, errorKey: 'emailTaken', loginHint: true }
    }
    if (response.status === 403) {
      return { ok: false, errorKey: 'disabled' }
    }
    if (response.status === 400) {
      const body = (await response.json().catch(() => ({}))) as { message?: string }
      return { ok: false, errorKey: 'genericError', detail: body.message }
    }
    return { ok: false, errorKey: 'somethingWentWrong' }
  }

  const result = (await response.json()) as AuthResult | { linked: true }

  if ('linked' in result) {
    // The address already had a mobile-only account and was attached to this new operator
    // as its admin, not created — no session is minted here (see
    // operator-registration.service.ts#register): a token issued in the same instant as
    // the role's revocation-watermark bump risks landing in the same whole second and
    // being dead on arrival. The person just proved they know this password by typing it
    // correctly; they sign in with it.
    redirect('/login?linked=success')
  }

  await establishSessions({
    accessToken: result.session.accessToken,
    refreshToken: result.session.refreshToken,
    expiresAt: result.session.expiresAt,
    user: result.session.user,
  })

  redirect('/dashboard')
}
