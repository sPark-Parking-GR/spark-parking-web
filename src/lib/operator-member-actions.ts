'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { apiFetch, ApiError, AuthRequiredError } from './api'

export type OperatorMemberRole = 'STAFF' | 'ADMIN'

export type OperatorMemberErrorKey =
  | 'errors.forbidden'
  | 'errors.notFound'
  | 'errors.conflict'
  | 'errors.genericError'

export type OperatorMemberActionResult =
  | { ok: true }
  | { ok: false; errorKey: OperatorMemberErrorKey; detail?: string }

const roleSchema = z.enum(['STAFF', 'ADMIN'])

function mapError(err: unknown): OperatorMemberActionResult {
  if (err instanceof AuthRequiredError) redirect('/login')
  if (err instanceof ApiError) {
    if (err.status === 403) return { ok: false, errorKey: 'errors.forbidden' }
    if (err.status === 404) return { ok: false, errorKey: 'errors.notFound' }
    if (err.status === 409) {
      return { ok: false, errorKey: 'errors.conflict', detail: err.message || undefined }
    }
  }
  return { ok: false, errorKey: 'errors.genericError' }
}

export async function changeOperatorMemberRoleAction(
  operatorId: string,
  userId: string,
  role: OperatorMemberRole,
): Promise<OperatorMemberActionResult> {
  const parsed = roleSchema.safeParse(role)
  if (!parsed.success) return { ok: false, errorKey: 'errors.genericError' }

  try {
    await apiFetch(`/operators/${operatorId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: parsed.data }),
    })
  } catch (err) {
    return mapError(err)
  }
  revalidatePath(`/admin/operators/${operatorId}`)
  return { ok: true }
}

export async function removeOperatorMemberAction(
  operatorId: string,
  userId: string,
): Promise<OperatorMemberActionResult> {
  try {
    await apiFetch(`/operators/${operatorId}/members/${userId}`, { method: 'DELETE' })
  } catch (err) {
    return mapError(err)
  }
  revalidatePath(`/admin/operators/${operatorId}`)
  return { ok: true }
}
