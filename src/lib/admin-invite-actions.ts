'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { apiFetch, ApiError, AuthRequiredError } from './api'
import { establishSessions } from './session'
import type { AuthResult } from '@spark/types'
import type {
  AdminInviteIssued,
  AdminInviteSummary,
  AdminInviteTokenValidation,
} from './admin-invite-types'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://127.0.0.1:3001/api/v1'

const ADMINS_PATH = '/admin/admins'

export type AdminInviteMutationErrorKey =
  | 'errors.invalidInvite'
  | 'errors.forbidden'
  | 'errors.inviteNotFound'
  | 'errors.emailTaken'
  | 'errors.invalidData'
  | 'errors.genericError'
  | string

export type SendAdminInviteResult =
  | { ok: true; delivered: boolean }
  | { ok: false; errorKey: AdminInviteMutationErrorKey; detail?: string }

export type ResendAdminInviteResult =
  | { ok: true; delivered: boolean }
  | { ok: false; errorKey: AdminInviteMutationErrorKey; detail?: string }

export type RevokeAdminInviteResult =
  | { ok: true }
  | { ok: false; errorKey: AdminInviteMutationErrorKey; detail?: string }

export type ValidateAdminInviteResult =
  | { ok: true; data: AdminInviteTokenValidation }
  | { ok: false; status: number }

export type AcceptAdminInviteResult = {
  ok: false
  errorKey: string
  detail?: string
  loginHint?: boolean
}

const sendAdminInviteSchema = z.object({
  email: z.string().trim().email('validation.emailInvalid'),
  displayName: z
    .string()
    .trim()
    .max(200, 'validation.displayNameTooLong')
    .optional()
    .transform((value) => (value ? value : undefined)),
})

const setPasswordSchema = z
  .object({
    password: z.string().min(8, 'passwordTooShort').max(200, 'passwordTooLong'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordsMismatch',
    path: ['confirmPassword'],
  })

export async function sendAdminInviteAction(
  _prev: SendAdminInviteResult,
  formData: FormData,
): Promise<SendAdminInviteResult> {
  const parsed = sendAdminInviteSchema.safeParse({
    email: formData.get('email'),
    displayName: formData.get('displayName'),
  })
  if (!parsed.success) {
    return { ok: false, errorKey: parsed.error.issues[0]?.message ?? 'errors.invalidData' }
  }

  let issued: AdminInviteIssued
  try {
    issued = await apiFetch<AdminInviteIssued>('/admin-invites', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      if (err.status === 403) return { ok: false, errorKey: 'errors.forbidden' }
      if (err.status === 409) return { ok: false, errorKey: 'errors.emailTaken' }
      if (err.status === 400) {
        const detail = err.errors
          ?.map((issue) => (issue.path ? `${issue.path}: ${issue.message}` : issue.message))
          .join('; ')
        return {
          ok: false,
          errorKey: 'errors.invalidData',
          detail: detail || err.message || undefined,
        }
      }
    }
    return { ok: false, errorKey: 'errors.genericError' }
  }

  revalidatePath(ADMINS_PATH)
  return { ok: true, delivered: issued.delivered }
}

export async function listAdminInvitesAction(): Promise<AdminInviteSummary[]> {
  try {
    return await apiFetch<AdminInviteSummary[]>('/admin-invites')
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    return []
  }
}

export async function resendAdminInviteAction(
  _prev: ResendAdminInviteResult,
  formData: FormData,
): Promise<ResendAdminInviteResult> {
  const id = String(formData.get('id'))
  if (!id) return { ok: false, errorKey: 'errors.invalidInvite' }

  let issued: AdminInviteIssued
  try {
    issued = await apiFetch<AdminInviteIssued>(`/admin-invites/${id}/resend`, {
      method: 'POST',
    })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      if (err.status === 403) return { ok: false, errorKey: 'errors.forbidden' }
      if (err.status === 404) return { ok: false, errorKey: 'errors.inviteNotFound' }
      if (err.status === 409)
        return { ok: false, errorKey: 'errors.genericError', detail: err.message }
    }
    return { ok: false, errorKey: 'errors.genericError' }
  }

  revalidatePath(ADMINS_PATH)
  return { ok: true, delivered: issued.delivered }
}

export async function revokeAdminInviteAction(
  _prev: RevokeAdminInviteResult,
  formData: FormData,
): Promise<RevokeAdminInviteResult> {
  const id = String(formData.get('id'))
  if (!id) return { ok: false, errorKey: 'errors.invalidInvite' }

  try {
    await apiFetch(`/admin-invites/${id}/revoke`, { method: 'POST' })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      if (err.status === 403) return { ok: false, errorKey: 'errors.forbidden' }
      if (err.status === 404) return { ok: false, errorKey: 'errors.inviteNotFound' }
      if (err.status === 409)
        return { ok: false, errorKey: 'errors.genericError', detail: err.message }
    }
    return { ok: false, errorKey: 'errors.genericError' }
  }

  revalidatePath(ADMINS_PATH)
  return { ok: true }
}

export async function validateAdminInviteAction(
  token: string,
): Promise<ValidateAdminInviteResult> {
  try {
    const response = await fetch(
      `${BASE_URL}/admin-invites/token/${encodeURIComponent(token)}`,
      { cache: 'no-store' },
    )
    if (!response.ok) {
      return { ok: false, status: response.status }
    }
    const data = (await response.json()) as AdminInviteTokenValidation
    return { ok: true, data }
  } catch {
    return { ok: false, status: 0 }
  }
}

export async function acceptAdminInviteAction(
  token: string,
  input: { password: string; confirmPassword: string },
): Promise<AcceptAdminInviteResult> {
  const parsed = setPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errorKey: parsed.error.issues[0]?.message ?? 'genericError' }
  }

  let response: Response
  try {
    response = await fetch(
      `${BASE_URL}/admin-invites/token/${encodeURIComponent(token)}/accept`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: parsed.data.password }),
        cache: 'no-store',
      },
    )
  } catch {
    return { ok: false, errorKey: 'unreachable' }
  }

  if (!response.ok) {
    if (response.status === 409) {
      // Two different conflicts share this status, and they are opposites: a link that was
      // genuinely redeemed already, versus an address that already has an account. Reporting
      // the second as the first is how a live invite looks like a reused one.
      const body = (await response.json().catch(() => ({}))) as { code?: string }
      return {
        ok: false,
        errorKey: body.code === 'EMAIL_TAKEN' ? 'emailTaken' : 'alreadyUsed',
        loginHint: true,
      }
    }
    if (response.status === 410) {
      return { ok: false, errorKey: 'expired' }
    }
    if (response.status === 404) {
      return { ok: false, errorKey: 'invalidLink' }
    }
    if (response.status === 400) {
      const body = (await response.json().catch(() => ({}))) as { message?: string }
      return { ok: false, errorKey: 'genericError', detail: body.message }
    }
    return { ok: false, errorKey: 'somethingWentWrong' }
  }

  const result = (await response.json()) as AuthResult
  await establishSessions({
    accessToken: result.session.accessToken,
    refreshToken: result.session.refreshToken,
    expiresAt: result.session.expiresAt,
    user: result.session.user,
  })

  redirect('/dashboard')
}
