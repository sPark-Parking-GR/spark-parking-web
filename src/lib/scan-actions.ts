'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { ApiError, AuthRequiredError } from './api'
import { isValidAccessCode, normalizeAccessCode } from './access-code'
import { verifyQr } from './scan-api'
import type { VerifyQrResponse } from './scan-api'

const verifyQrInputSchema = z
  .object({
    payload: z.string().trim().min(1).max(256).optional(),
    accessCode: z.string().trim().min(1).max(64).optional(),
  })
  .refine((data) => Boolean(data.payload) !== Boolean(data.accessCode), {
    message: 'exactlyOne',
  })

export type ScanErrorKey =
  'invalidFormat' | 'malformed' | 'notFound' | 'redisUnavailable' | 'rateLimited' | 'genericError'

export type VerifyQrActionResult =
  { ok: true; result: VerifyQrResponse } | { ok: false; errorKey: ScanErrorKey }

export interface VerifyQrActionInput {
  payload?: string
  accessCode?: string
}

export async function verifyQrAction(input: VerifyQrActionInput): Promise<VerifyQrActionResult> {
  const parsed = verifyQrInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errorKey: 'invalidFormat' }
  }

  const accessCode = parsed.data.accessCode
    ? normalizeAccessCode(parsed.data.accessCode)
    : undefined
  if (accessCode && !isValidAccessCode(accessCode)) {
    return { ok: false, errorKey: 'invalidFormat' }
  }

  try {
    const result = await verifyQr({
      payload: parsed.data.payload,
      accessCode,
      autoCheckIn: true,
    })
    return { ok: true, result }
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      if (err.status === 429) return { ok: false, errorKey: 'rateLimited' }
      if (err.status === 503) return { ok: false, errorKey: 'redisUnavailable' }
      if (err.status === 404) return { ok: false, errorKey: 'notFound' }
      if (err.status === 400) return { ok: false, errorKey: 'malformed' }
    }
    return { ok: false, errorKey: 'genericError' }
  }
}
