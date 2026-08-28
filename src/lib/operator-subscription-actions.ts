'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ApiError, AuthRequiredError } from './api'
import { requestOperatorCheckout, requestOperatorUpgrade } from './operator-subscription-api'

const BILLING_PATH = '/dashboard/billing'

type SharedBillingErrorKey =
  | 'errors.forbidden'
  | 'errors.notFound'
  | 'errors.invalidData'
  | 'errors.genericError'

export type UpgradeRequestErrorKey =
  | SharedBillingErrorKey
  | 'errors.conflict'
  | 'validation.planRequired'
  | 'validation.messageTooLong'

export type CheckoutErrorKey =
  | SharedBillingErrorKey
  | 'plans.alreadySubscribed'
  | 'validation.planRequired'

// Duplicated per domain rather than shared, following TeamActionResult: the errorKey space
// is namespace-local, so a shared type would only hide which messages file has to define it.
export type UpgradeRequestResult =
  | { ok: true }
  | { ok: false; errorKey: UpgradeRequestErrorKey; detail?: string }

// The checkout URL is handed back rather than redirected to: a Server Action redirect to an
// external host leaves the caller unable to render the 409 inline, and the browser has to do
// a full document navigation to Stripe either way.
export type CheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; errorKey: CheckoutErrorKey; detail?: string }

function mapApiError<K extends string>(
  err: unknown,
  conflictKey: K,
): { ok: false; errorKey: SharedBillingErrorKey | K; detail?: string } {
  if (err instanceof AuthRequiredError) {
    redirect('/login')
  }
  if (err instanceof ApiError) {
    if (err.status === 403) return { ok: false, errorKey: 'errors.forbidden' }
    if (err.status === 404) return { ok: false, errorKey: 'errors.notFound' }
    if (err.status === 409) {
      return { ok: false, errorKey: conflictKey, detail: err.message || undefined }
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

const upgradeRequestSchema = z.object({
  requestedPlanId: z.string().trim().min(1, 'validation.planRequired'),
  message: z.string().trim().max(1000, 'validation.messageTooLong'),
})

const checkoutSchema = z.object({
  planId: z.string().trim().min(1, 'validation.planRequired'),
})

export async function requestUpgradeAction(
  requestedPlanId: string,
  message: string,
): Promise<UpgradeRequestResult> {
  const parsed = upgradeRequestSchema.safeParse({ requestedPlanId, message })
  if (!parsed.success) {
    return {
      ok: false,
      errorKey: (parsed.error.issues[0]?.message as UpgradeRequestErrorKey) ?? 'errors.invalidData',
    }
  }

  try {
    await requestOperatorUpgrade({
      requestedPlanId: parsed.data.requestedPlanId,
      ...(parsed.data.message ? { message: parsed.data.message } : {}),
    })
  } catch (err) {
    return mapApiError(err, 'errors.conflict')
  }

  revalidatePath(BILLING_PATH)
  return { ok: true }
}

export async function startOperatorCheckoutAction(planId: string): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse({ planId })
  if (!parsed.success) {
    return {
      ok: false,
      errorKey: (parsed.error.issues[0]?.message as CheckoutErrorKey) ?? 'errors.invalidData',
    }
  }

  try {
    const { checkoutUrl } = await requestOperatorCheckout(parsed.data.planId)
    return { ok: true, checkoutUrl }
  } catch (err) {
    return mapApiError(err, 'plans.alreadySubscribed')
  }
}
