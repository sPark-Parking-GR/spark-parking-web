'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { OrgPermission } from '@spark/types'
import { apiFetch, ApiError, AuthRequiredError } from './api'
import { TEAM_MEMBER_ROLES } from './team-types'
import type { TeamMemberRole } from './team-types'

const TEAM_PATH = '/dashboard/team'

export type TeamErrorKey =
  | 'errors.forbidden'
  | 'errors.notFound'
  | 'errors.conflict'
  | 'errors.invalidData'
  | 'errors.genericError'

export type TeamActionResult = { ok: true } | { ok: false; errorKey: TeamErrorKey; detail?: string }

export type InviteMemberErrorKey =
  | TeamErrorKey
  | 'errors.seatLimitReached'
  | 'validation.emailInvalid'

export type InviteMemberResult =
  | { ok: true; delivered: boolean }
  | { ok: false; errorKey: InviteMemberErrorKey; detail?: string }

function mapWriteError(err: unknown): { ok: false; errorKey: TeamErrorKey; detail?: string } {
  if (err instanceof AuthRequiredError) redirect('/login')
  if (err instanceof ApiError) {
    if (err.status === 403) return { ok: false, errorKey: 'errors.forbidden' }
    if (err.status === 404) return { ok: false, errorKey: 'errors.notFound' }
    if (err.status === 409) {
      return { ok: false, errorKey: 'errors.conflict', detail: err.message || undefined }
    }
    if (err.status === 400) {
      const detail = err.errors
        ?.map((issue) => (issue.path ? `${issue.path}: ${issue.message}` : issue.message))
        .join('; ')
      return { ok: false, errorKey: 'errors.invalidData', detail: detail || err.message }
    }
  }
  return { ok: false, errorKey: 'errors.genericError' }
}

const inviteMemberSchema = z.object({
  email: z.string().trim().email('validation.emailInvalid'),
  role: z.enum(TEAM_MEMBER_ROLES),
})

export async function inviteMemberAction(
  _prev: InviteMemberResult,
  formData: FormData,
): Promise<InviteMemberResult> {
  const parsed = inviteMemberSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  })
  if (!parsed.success) {
    return {
      ok: false,
      errorKey: (parsed.error.issues[0]?.message as InviteMemberErrorKey) ?? 'errors.invalidData',
    }
  }

  let issued: { delivered: boolean }
  try {
    issued = await apiFetch<{ delivered: boolean }>('/invites/members', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    // A seat-quota 409 is a plan limit, not a failure — kept distinct from every other
    // conflict this endpoint can raise so the form can offer an upgrade path instead of
    // a red error toast.
    if (err instanceof ApiError && err.status === 409) {
      return { ok: false, errorKey: 'errors.seatLimitReached', detail: err.message || undefined }
    }
    return mapWriteError(err)
  }

  revalidatePath(TEAM_PATH)
  return { ok: true, delivered: issued.delivered }
}

const changeRoleSchema = z.enum(TEAM_MEMBER_ROLES)

export async function changeMemberRoleAction(
  operatorId: string,
  userId: string,
  role: TeamMemberRole,
): Promise<TeamActionResult> {
  const parsed = changeRoleSchema.safeParse(role)
  if (!parsed.success) return { ok: false, errorKey: 'errors.invalidData' }

  try {
    await apiFetch(`/operators/${operatorId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: parsed.data }),
    })
  } catch (err) {
    return mapWriteError(err)
  }

  revalidatePath(TEAM_PATH)
  return { ok: true }
}

export async function setMemberScopesAction(
  operatorId: string,
  userId: string,
  scopes: OrgPermission[],
): Promise<TeamActionResult> {
  try {
    await apiFetch(`/operators/${operatorId}/members/${userId}/scopes`, {
      method: 'PATCH',
      body: JSON.stringify({ scopes }),
    })
  } catch (err) {
    return mapWriteError(err)
  }

  revalidatePath(TEAM_PATH)
  return { ok: true }
}

export async function removeMemberAction(
  operatorId: string,
  userId: string,
): Promise<TeamActionResult> {
  try {
    await apiFetch(`/operators/${operatorId}/members/${userId}`, { method: 'DELETE' })
  } catch (err) {
    return mapWriteError(err)
  }

  revalidatePath(TEAM_PATH)
  return { ok: true }
}
