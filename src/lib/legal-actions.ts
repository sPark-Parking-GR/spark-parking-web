'use server'

import { z } from 'zod'
import { LEGAL_VERSION_PATTERN } from '@spark/types'
import { apiFetch, ApiError, AuthRequiredError } from './api'

const acceptSchema = z.object({
  terms: z.string().regex(LEGAL_VERSION_PATTERN),
  privacy: z.string().regex(LEGAL_VERSION_PATTERN),
})

export type AcceptLegalResult =
  { ok: true } | { ok: false; errorKey: 'stale' | 'authRequired' | 'generic' }

export async function acceptLegalAction(input: {
  terms: string
  privacy: string
}): Promise<AcceptLegalResult> {
  const parsed = acceptSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errorKey: 'generic' }

  try {
    await apiFetch('/legal/accept', { method: 'POST', body: JSON.stringify(parsed.data) })
  } catch (err) {
    if (err instanceof AuthRequiredError) return { ok: false, errorKey: 'authRequired' }
    if (err instanceof ApiError && err.code === 'legal_version_stale') {
      return { ok: false, errorKey: 'stale' }
    }
    return { ok: false, errorKey: 'generic' }
  }
  return { ok: true }
}
