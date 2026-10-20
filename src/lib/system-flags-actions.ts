'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ApiError, AuthRequiredError } from './api'
import { setBillingEnabled } from './system-flags-api'

export type SystemFlagActionResult = { ok: true } | { ok: false; errorKey: string }

export async function setBillingEnabledAction(enabled: boolean): Promise<SystemFlagActionResult> {
  if (typeof enabled !== 'boolean') return { ok: false, errorKey: 'errors.genericError' }
  try {
    await setBillingEnabled(enabled)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) {
      return { ok: false, errorKey: 'errors.forbidden' }
    }
    return { ok: false, errorKey: 'errors.genericError' }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}
