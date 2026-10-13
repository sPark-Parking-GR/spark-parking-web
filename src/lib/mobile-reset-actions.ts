'use server'

import { z } from 'zod'
import { PASSWORD_MAX, PASSWORD_MIN } from '@spark/types'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://127.0.0.1:3001/api/v1'

const resetSchema = z.object({
  token: z.string().min(1).max(256),
  password: z.string().min(PASSWORD_MIN).max(PASSWORD_MAX),
})

export type MobileResetResult =
  | { status: 'success' }
  | { status: 'invalidToken' }
  | { status: 'rateLimited' }
  | { status: 'invalidPassword' }
  | { status: 'error' }

// The token only ever travels in the request body: it is never logged, echoed back or put
// in a URL, and a failure reports a status rather than the API's message.
export async function resetMobilePasswordAction(
  token: string,
  password: string,
): Promise<MobileResetResult> {
  const parsed = resetSchema.safeParse({ token, password })
  if (!parsed.success) {
    const tokenRejected = parsed.error.issues.some((issue) => issue.path[0] === 'token')
    return { status: tokenRejected ? 'invalidToken' : 'invalidPassword' }
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}/mobile-auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    })
  } catch {
    return { status: 'error' }
  }

  if (response.ok) return { status: 'success' }
  if (response.status === 429) return { status: 'rateLimited' }
  if (response.status === 400 || response.status === 404 || response.status === 410) {
    return { status: 'invalidToken' }
  }
  return { status: 'error' }
}
