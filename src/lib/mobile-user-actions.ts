'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { apiFetch, ApiError, AuthRequiredError } from './api'
import { assertMobilePermission, MobileAccessDeniedError } from './mobile-user-access'
import { mobileEraseSchema, mobileReasonSchema, mobileUserIdSchema } from './mobile-user-schema'

const LIST_PATH = '/admin/mobile-users'

export type MobileUserErrorKey =
  | 'errors.forbidden'
  | 'errors.notFound'
  | 'errors.conflict'
  | 'errors.unsettledBookings'
  | 'errors.emailMismatch'
  | 'errors.invalidReason'
  | 'errors.rateLimited'
  | 'errors.genericError'

type MobileUserFailure = { ok: false; errorKey: MobileUserErrorKey; detail?: string }

export type MobileUserActionResult = { ok: true } | MobileUserFailure

function mapError(err: unknown, erasing = false): MobileUserFailure {
  if (err instanceof AuthRequiredError) redirect('/login')
  if (err instanceof MobileAccessDeniedError) return { ok: false, errorKey: 'errors.forbidden' }
  if (err instanceof ApiError) {
    if (err.status === 403) return { ok: false, errorKey: 'errors.forbidden' }
    if (err.status === 404) return { ok: false, errorKey: 'errors.notFound' }
    if (err.status === 429) return { ok: false, errorKey: 'errors.rateLimited' }
    if (err.status === 422) return { ok: false, errorKey: 'errors.emailMismatch' }
    if (err.status === 409) {
      // Erasure is also refused with a 409 while bookings are unsettled; only the status
      // transition refusal carries a code, so any other erase 409 is the booking case.
      const isTransition = err.code === 'invalid_status_transition'
      return {
        ok: false,
        errorKey: erasing && !isTransition ? 'errors.unsettledBookings' : 'errors.conflict',
        detail: err.message || undefined,
      }
    }
    if (err.status === 400) {
      return { ok: false, errorKey: 'errors.genericError', detail: err.message || undefined }
    }
  }
  return { ok: false, errorKey: 'errors.genericError' }
}

function revalidateMobileUser(id: string): void {
  revalidatePath(LIST_PATH)
  revalidatePath(`${LIST_PATH}/${id}`)
}

async function postAction(
  id: string,
  suffix: string,
  body: unknown,
  erasing = false,
): Promise<MobileUserActionResult> {
  try {
    await assertMobilePermission('identity:mobile.manage')
    await apiFetch<void>(`${LIST_PATH}/${id}/${suffix}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  } catch (err) {
    return mapError(err, erasing)
  }
  revalidateMobileUser(id)
  return { ok: true }
}

async function reasonAction(
  id: string,
  suffix: 'suspend' | 'reactivate' | 'revoke-sessions',
  reason: string,
): Promise<MobileUserActionResult> {
  const idResult = mobileUserIdSchema.safeParse(id)
  if (!idResult.success) return { ok: false, errorKey: 'errors.notFound' }
  const reasonResult = mobileReasonSchema.safeParse(reason)
  if (!reasonResult.success) return { ok: false, errorKey: 'errors.invalidReason' }
  return postAction(idResult.data, suffix, { reason: reasonResult.data })
}

export async function suspendMobileUserAction(
  id: string,
  reason: string,
): Promise<MobileUserActionResult> {
  return reasonAction(id, 'suspend', reason)
}

export async function reactivateMobileUserAction(
  id: string,
  reason: string,
): Promise<MobileUserActionResult> {
  return reasonAction(id, 'reactivate', reason)
}

export async function revokeMobileUserSessionsAction(
  id: string,
  reason: string,
): Promise<MobileUserActionResult> {
  return reasonAction(id, 'revoke-sessions', reason)
}

export async function eraseMobileUserAction(
  id: string,
  reason: string,
  confirmEmail: string,
): Promise<MobileUserActionResult> {
  const idResult = mobileUserIdSchema.safeParse(id)
  if (!idResult.success) return { ok: false, errorKey: 'errors.notFound' }
  const parsed = mobileEraseSchema.safeParse({ reason, confirmEmail })
  if (!parsed.success) {
    return {
      ok: false,
      errorKey: parsed.error.issues.some((issue) => issue.path[0] === 'reason')
        ? 'errors.invalidReason'
        : 'errors.emailMismatch',
    }
  }
  return postAction(idResult.data, 'erase', parsed.data, true)
}
