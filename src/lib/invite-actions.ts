'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { apiFetch, ApiError, AuthRequiredError } from './api'
import { setSession } from './session'
import type { AuthResult } from '@spark/types'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://127.0.0.1:3001/api/v1'

const ONBOARDING_PATH = '/dashboard/onboarding'

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

export interface InviteValidation {
  businessName: string
  email: string
  expired: boolean
}

export type InviteValidationResult =
  | { ok: true; data: InviteValidation }
  | { ok: false; status: number }

export type SendInviteResult = { ok: true } | { ok: false; error: string }

export type InviteActionResult = { ok: true } | { ok: false; error: string }

export type AcceptInviteResult = { ok: false; error: string; loginHint?: boolean }

const sendInviteSchema = z.object({
  businessName: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
})

const setPasswordSchema = z
  .object({
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export async function sendInviteAction(
  _prev: SendInviteResult,
  formData: FormData,
): Promise<SendInviteResult> {
  const parsed = sendInviteSchema.safeParse({
    businessName: formData.get('businessName'),
    email: formData.get('email'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  try {
    await apiFetch('/invites', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      if (err.status === 403) return { ok: false, error: 'You are not allowed to send invites.' }
      if (err.status === 400) {
        const detail = err.errors
          ?.map((issue) => (issue.path ? `${issue.path}: ${issue.message}` : issue.message))
          .join('; ')
        return { ok: false, error: detail || err.message || 'Invalid data. Check all fields.' }
      }
    }
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }

  revalidatePath(ONBOARDING_PATH)
  return { ok: true }
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
  if (!id) return { ok: false, error: 'Invalid invite.' }

  try {
    await apiFetch(`/invites/${id}/revoke`, { method: 'POST' })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      if (err.status === 403) return { ok: false, error: 'You are not allowed to revoke invites.' }
      if (err.status === 404) return { ok: false, error: 'Invite not found.' }
      if (err.status === 409) return { ok: false, error: err.message }
    }
    return { ok: false, error: 'Something went wrong. Please try again.' }
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
  input: { password: string; confirmPassword: string },
): Promise<AcceptInviteResult> {
  const parsed = setPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid password.' }
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}/invites/${encodeURIComponent(token)}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: parsed.data.password }),
      cache: 'no-store',
    })
  } catch {
    return { ok: false, error: 'Unable to reach the server right now. Please try again.' }
  }

  if (!response.ok) {
    if (response.status === 409) {
      return { ok: false, error: 'This invite was already used.', loginHint: true }
    }
    if (response.status === 410) {
      return { ok: false, error: 'This invite has expired. Ask the platform to send a new one.' }
    }
    if (response.status === 404) {
      return { ok: false, error: 'This invite link is invalid.' }
    }
    if (response.status === 400) {
      const body = (await response.json().catch(() => ({}))) as { message?: string }
      return { ok: false, error: body.message ?? 'Enter a valid password.' }
    }
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }

  const result = (await response.json()) as AuthResult
  await setSession({
    accessToken: result.session.accessToken,
    refreshToken: result.session.refreshToken,
    expiresAt: result.session.expiresAt,
    user: result.session.user,
  })

  redirect('/dashboard')
}
