'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { apiFetch, ApiError, AuthRequiredError } from './api'
import { archiveResource, restoreResource } from './lifecycle-api'
import type { AssignableIdentityRole } from './identity-api'

const USERS_PATH = '/admin/users'

const requiredReasonSchema = z.string().trim().min(3)
const optionalReasonSchema = z.string().trim().optional()

export type IdentityErrorKey =
  | 'errors.forbidden'
  | 'errors.notFound'
  | 'errors.conflict'
  | 'errors.expired'
  | 'errors.invalidReason'
  | 'errors.genericError'

type IdentityFailure = { ok: false; errorKey: IdentityErrorKey; detail?: string }

export type IdentityActionResult = { ok: true } | IdentityFailure

function mapApiError(err: unknown): IdentityFailure {
  if (err instanceof AuthRequiredError) {
    redirect('/login')
  }
  if (err instanceof ApiError) {
    if (err.status === 403) return { ok: false, errorKey: 'errors.forbidden' }
    if (err.status === 404) return { ok: false, errorKey: 'errors.notFound' }
    if (err.status === 410) {
      return { ok: false, errorKey: 'errors.expired', detail: err.message || undefined }
    }
    if (err.status === 409) {
      return { ok: false, errorKey: 'errors.conflict', detail: err.message || undefined }
    }
    if (err.status === 400) {
      return { ok: false, errorKey: 'errors.genericError', detail: err.message || undefined }
    }
  }
  return { ok: false, errorKey: 'errors.genericError' }
}

function revalidateUser(id: string): void {
  revalidatePath(USERS_PATH)
  revalidatePath(`${USERS_PATH}/${id}`)
}

export async function assignUserRoleAction(
  id: string,
  role: AssignableIdentityRole,
  reason: string,
): Promise<IdentityActionResult> {
  const parsed = requiredReasonSchema.safeParse(reason)
  if (!parsed.success) return { ok: false, errorKey: 'errors.invalidReason' }

  try {
    await apiFetch<void>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, reason: parsed.data }),
    })
  } catch (err) {
    return mapApiError(err)
  }
  revalidateUser(id)
  return { ok: true }
}

export async function suspendUserAction(id: string, reason: string): Promise<IdentityActionResult> {
  const parsed = requiredReasonSchema.safeParse(reason)
  if (!parsed.success) return { ok: false, errorKey: 'errors.invalidReason' }

  try {
    await archiveResource('user', id, parsed.data)
  } catch (err) {
    return mapApiError(err)
  }
  revalidateUser(id)
  return { ok: true }
}

export async function restoreUserAction(
  id: string,
  reason?: string,
): Promise<IdentityActionResult> {
  const parsed = optionalReasonSchema.safeParse(reason)
  if (!parsed.success) return { ok: false, errorKey: 'errors.invalidReason' }

  try {
    await restoreResource('user', id, parsed.data)
  } catch (err) {
    return mapApiError(err)
  }
  revalidateUser(id)
  return { ok: true }
}

export async function requestUserDemotionAction(
  id: string,
  reason: string,
): Promise<IdentityActionResult> {
  const parsed = requiredReasonSchema.safeParse(reason)
  if (!parsed.success) return { ok: false, errorKey: 'errors.invalidReason' }

  try {
    await apiFetch<void>(`/admin/users/${id}/demote`, {
      method: 'POST',
      body: JSON.stringify({ reason: parsed.data }),
    })
  } catch (err) {
    return mapApiError(err)
  }
  revalidateUser(id)
  return { ok: true }
}

export async function approveUserDemotionAction(
  approvalId: string,
  userId: string,
): Promise<IdentityActionResult> {
  try {
    await apiFetch<void>(`/admin/users/approvals/${approvalId}/approve`, { method: 'POST' })
  } catch (err) {
    return mapApiError(err)
  }
  revalidateUser(userId)
  return { ok: true }
}

export async function rejectUserDemotionAction(
  approvalId: string,
  userId: string,
  reason: string,
): Promise<IdentityActionResult> {
  const parsed = requiredReasonSchema.safeParse(reason)
  if (!parsed.success) return { ok: false, errorKey: 'errors.invalidReason' }

  try {
    await apiFetch<void>(`/admin/users/approvals/${approvalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: parsed.data }),
    })
  } catch (err) {
    return mapApiError(err)
  }
  revalidateUser(userId)
  return { ok: true }
}
