'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { apiFetch, ApiError, AuthRequiredError } from './api'
import { refreshSessionUser } from './session'

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
