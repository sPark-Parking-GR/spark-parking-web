'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { apiFetch, ApiError, AuthRequiredError } from './api'
import { forgotPasswordAction } from './password-reset-actions'
import { getActiveSession, refreshSessionUser } from './session'

const profileSchema = z.object({
  // Empty clears the name back to the email, which is a legitimate thing to want and the
  // only way to undo a company name that was written here by the old accept flow.
  displayName: z.string().trim().max(120, 'errors.nameTooLong'),
})

export type ProfileActionResult =
  | { ok: true }
  | { ok: false; errorKey: 'errors.nameTooLong' | 'errors.genericError'; detail?: string }

export async function updateProfileAction(
  _prev: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const parsed = profileSchema.safeParse({ displayName: formData.get('displayName') })
  if (!parsed.success) {
    return { ok: false, errorKey: parsed.error.issues[0]?.message as 'errors.nameTooLong' }
  }

  try {
    await apiFetch('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ displayName: parsed.data.displayName }),
    })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      return { ok: false, errorKey: 'errors.genericError', detail: err.message || undefined }
    }
    return { ok: false, errorKey: 'errors.genericError' }
  }

  // The name is copied into the session cookie at sign-in, and the topbar renders it from
  // there — without this the change would not show until the session was next established,
  // which for a 14-day cookie means "not for a fortnight".
  await refreshSessionUser({ displayName: parsed.data.displayName || null })
  revalidatePath('/dashboard', 'layout')
  return { ok: true }
}

export type ChangePasswordActionResult =
  | { ok: true }
  | { ok: false; errorKey: 'errors.wrongPassword' | 'errors.genericError'; detail?: string }

/**
 * Step one of the two-factor change: prove the current password. Nothing changes yet — the
 * API answers 204 and emails a one-time link, and the password only moves when that link is
 * opened, on the same /reset-password page the logged-out flow uses.
 *
 * The new password is deliberately not collected here. Asking for it before the mailbox has
 * been proved would mean either holding it somewhere until the link came back, or letting
 * the current password alone be enough — which is the single factor this flow exists to
 * stop being sufficient.
 */
export async function changePasswordAction(
  _prev: ChangePasswordActionResult,
  formData: FormData,
): Promise<ChangePasswordActionResult> {
  const currentPassword = formData.get('currentPassword')
  if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
    return { ok: false, errorKey: 'errors.genericError' }
  }

  try {
    await apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword }),
    })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      // apiFetch already spent its one silent refresh-and-retry on a 401 before throwing,
      // so a 401 arriving here is the API rejecting the password, not an expired session.
      // Sending the user to /login for it would be a lie about what went wrong.
      if (err.status === 401) return { ok: false, errorKey: 'errors.wrongPassword' }
      return { ok: false, errorKey: 'errors.genericError', detail: err.message || undefined }
    }
    return { ok: false, errorKey: 'errors.genericError' }
  }

  return { ok: true }
}

export type ResetLinkActionResult = { ok: true } | { ok: false; errorKey: 'errors.genericError' }

/**
 * The profile page's forgot-password trigger. Same public endpoint the logged-out page
 * calls, reached from a page where the address is already known — so the address is read
 * from the session cookie rather than accepted from the form. Nothing the client sends can
 * point this at a mailbox that is not the caller's own.
 */
export async function requestOwnPasswordResetAction(
  _prev: ResetLinkActionResult,
  _formData: FormData,
): Promise<ResetLinkActionResult> {
  const session = await getActiveSession()
  if (!session.accessToken || !session.user) redirect('/login')

  const result = await forgotPasswordAction({ email: session.user.email })
  return result.ok ? { ok: true } : { ok: false, errorKey: 'errors.genericError' }
}
