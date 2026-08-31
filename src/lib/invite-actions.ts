'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { apiFetch, ApiError, AuthRequiredError } from './api'
import { establishSessions } from './session'
import type { AuthResult } from '@spark/types'
import { PASSWORD_MAX, PASSWORD_MIN } from '@spark/types'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://127.0.0.1:3001/api/v1'

const ONBOARDING_PATH = '/admin/onboarding'

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'

export interface InviteSummary {
  id: string
  email: string
  businessName: string
  status: InviteStatus
  expiresAt: string
  createdAt: string
  acceptedAt: string | null
}

// What POST /invites and POST /invites/:id/resend return: the summary plus the one field
// the list endpoint cannot carry, because delivery is not persisted anywhere.
export interface InviteIssued extends InviteSummary {
  delivered: boolean
}

export type InviteKind = 'ONBOARDING' | 'MEMBER'

export interface InviteValidation {
  businessName: string
  email: string
  kind: InviteKind
  expired: boolean
  alreadyAccepted: boolean
}

export type InviteValidationResult =
  | { ok: true; data: InviteValidation }
  | { ok: false; status: number }

export type SendInviteErrorKey =
  | 'errors.sendInviteForbidden'
  | 'errors.invalidData'
  | 'errors.genericError'
  | string

// `delivered` is the provider's own answer, not a guess: the invite row is written before
// the mail is handed over and the send never throws, so a rejected sender identity or a
// dead provider leaves a PENDING invite nobody can redeem. Reporting that as success is
// how an admin waits days for an operator who was never written to.
export type SendInviteResult =
  | { ok: true; delivered: boolean }
  | { ok: false; errorKey: SendInviteErrorKey; detail?: string }

export type InviteActionResult =
  | { ok: true }
  | {
      ok: false
      errorKey:
        | 'errors.invalidInvite'
        | 'errors.revokeForbidden'
        | 'errors.inviteNotFound'
        | 'errors.genericError'
      detail?: string
    }

export type ResendInviteResult =
  | { ok: true; delivered: boolean }
  | {
      ok: false
      errorKey:
        | 'errors.invalidInvite'
        | 'errors.sendInviteForbidden'
        | 'errors.inviteNotFound'
        | 'errors.genericError'
      detail?: string
    }

export type AcceptInviteResult = {
  ok: false
  errorKey: string
  detail?: string
  loginHint?: boolean
}

const sendInviteSchema = z.object({
  email: z.string().trim().email('validation.emailInvalid'),
})

const setPasswordSchema = z
  .object({
    password: z.string().min(PASSWORD_MIN, 'passwordTooShort').max(PASSWORD_MAX, 'passwordTooLong'),
    confirmPassword: z.string(),
    businessName: z
      .string()
      .trim()
      .min(1, 'businessNameRequired')
      .max(200, 'businessNameTooLong')
      .optional(),
    displayName: z.string().trim().min(1, 'yourNameRequired').max(120, 'yourNameTooLong'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordsMismatch',
    path: ['confirmPassword'],
  })

export async function sendInviteAction(
  _prev: SendInviteResult,
  formData: FormData,
): Promise<SendInviteResult> {
  const parsed = sendInviteSchema.safeParse({
    email: formData.get('email'),
  })
  if (!parsed.success) {
    return { ok: false, errorKey: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }
  }

  let issued: InviteIssued
  try {
    issued = await apiFetch<InviteIssued>('/invites', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      if (err.status === 403) return { ok: false, errorKey: 'errors.sendInviteForbidden' }
      // The address already has an account. Refused at issue rather than discovered by the
      // recipient at redeem, so the admin who can act on it is the one who is told.
      if (err.status === 409) {
        return { ok: false, errorKey: 'errors.genericError', detail: err.message || undefined }
      }
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

  revalidatePath(ONBOARDING_PATH)
  return { ok: true, delivered: issued.delivered }
}

export async function resendInviteAction(
  _prev: ResendInviteResult,
  formData: FormData,
): Promise<ResendInviteResult> {
  const id = String(formData.get('id'))
  if (!id) return { ok: false, errorKey: 'errors.invalidInvite' }

  let issued: InviteIssued
  try {
    issued = await apiFetch<InviteIssued>(`/invites/${id}/resend`, { method: 'POST' })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      if (err.status === 403) return { ok: false, errorKey: 'errors.sendInviteForbidden' }
      if (err.status === 404) return { ok: false, errorKey: 'errors.inviteNotFound' }
      if (err.status === 409)
        return { ok: false, errorKey: 'errors.genericError', detail: err.message }
    }
    return { ok: false, errorKey: 'errors.genericError' }
  }

  revalidatePath(ONBOARDING_PATH)
  return { ok: true, delivered: issued.delivered }
}

export async function listInvitesAction(): Promise<InviteSummary[]> {
  try {
    return await apiFetch<InviteSummary[]>('/invites')
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    return []
  }
}

export async function revokeInviteAction(
  _prev: InviteActionResult,
  formData: FormData,
): Promise<InviteActionResult> {
  const id = String(formData.get('id'))
  if (!id) return { ok: false, errorKey: 'errors.invalidInvite' }

  try {
    await apiFetch(`/invites/${id}/revoke`, { method: 'POST' })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      if (err.status === 403) return { ok: false, errorKey: 'errors.revokeForbidden' }
      if (err.status === 404) return { ok: false, errorKey: 'errors.inviteNotFound' }
      if (err.status === 409)
        return { ok: false, errorKey: 'errors.genericError', detail: err.message }
    }
    return { ok: false, errorKey: 'errors.genericError' }
  }

  revalidatePath(ONBOARDING_PATH)
  return { ok: true }
}

export async function validateInviteAction(token: string): Promise<InviteValidationResult> {
  try {
    const response = await fetch(`${BASE_URL}/invites/${encodeURIComponent(token)}`, {
      cache: 'no-store',
    })
    if (!response.ok) {
      return { ok: false, status: response.status }
    }
    const data = (await response.json()) as InviteValidation
    return { ok: true, data }
  } catch {
    return { ok: false, status: 0 }
  }
}

export async function acceptInviteAction(
  token: string,
  input: { password: string; confirmPassword: string; businessName?: string; displayName: string },
): Promise<AcceptInviteResult> {
  const parsed = setPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errorKey: parsed.error.issues[0]?.message ?? 'genericError' }
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}/invites/${encodeURIComponent(token)}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
