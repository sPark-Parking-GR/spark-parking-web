'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ApiError, AuthRequiredError } from './api'
import {
  archiveDriverPlan,
  assignDriverSubscription,
  createDriverPlan,
  setDriverEntitlementOverride,
  updateDriverPlan,
} from './driver-plan-api'
import {
  DRIVER_SUBSCRIPTION_STATUSES,
  driverEntitlementOverrideSchema,
  driverPlanDraftSchema,
} from './driver-plan-types'
import type { UpdateDriverPlanInput } from './driver-plan-api'
import type {
  DriverEntitlementOverride,
  DriverPlanDraftValues,
  DriverSubscriptionStatus,
} from './driver-plan-types'

const DRIVER_PLANS_PATH = '/admin/driver-plans'

// Duplicated per domain rather than shared, following TeamActionResult: the errorKey space
// is namespace-local, so a shared type would only hide which messages file has to define it.
export type DriverPlanActionResult = { ok: true } | { ok: false; errorKey: string; detail?: string }

function mapApiError(err: unknown): DriverPlanActionResult {
  if (err instanceof AuthRequiredError) {
    redirect('/login')
  }
  if (err instanceof ApiError) {
    if (err.status === 403) return { ok: false, errorKey: 'errors.forbidden' }
    if (err.status === 404) return { ok: false, errorKey: 'errors.notFound' }
    // 409 covers both a taken code and an archive blocked by live subscribers; each states
    // the offending code and count, so the API's own sentence beats any generic rewrite.
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

// The PATCH route rejects `code` outright, so the edit path sends every field except it.
function toUpdateInput(draft: DriverPlanDraftValues): UpdateDriverPlanInput {
  return {
    name: draft.name,
    description: draft.description,
    priceCents: draft.priceCents,
    currency: draft.currency,
    interval: draft.interval,
    entitlements: draft.entitlements,
    isPublic: draft.isPublic,
    sortOrder: draft.sortOrder,
  }
}

export async function saveDriverPlanAction(
  planId: string | null,
  _prev: DriverPlanActionResult,
  formData: FormData,
): Promise<DriverPlanActionResult> {
  const rawDraft = formData.get('draft')
  if (typeof rawDraft !== 'string') {
    return { ok: false, errorKey: 'errors.missingDraft' }
  }

  let json: unknown
  try {
    json = JSON.parse(rawDraft)
  } catch {
    return { ok: false, errorKey: 'errors.invalidJson' }
  }

  const parsed = driverPlanDraftSchema.safeParse(json)
  if (!parsed.success) {
    return { ok: false, errorKey: parsed.error.issues[0]?.message ?? 'errors.invalidConfig' }
  }

  try {
    if (planId) {
      await updateDriverPlan(planId, toUpdateInput(parsed.data))
    } else {
      await createDriverPlan(parsed.data)
    }
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(DRIVER_PLANS_PATH)
  if (planId) {
    revalidatePath(`${DRIVER_PLANS_PATH}/${planId}`)
  }
  redirect(DRIVER_PLANS_PATH)
}

export async function archiveDriverPlanAction(
  planId: string,
  reason?: string,
): Promise<DriverPlanActionResult> {
  const trimmed = reason?.trim()
  if (trimmed !== undefined && trimmed.length > 0 && trimmed.length < 3) {
    return { ok: false, errorKey: 'validation.reasonTooShort' }
  }

  try {
    await archiveDriverPlan(planId, trimmed || undefined)
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(DRIVER_PLANS_PATH)
  revalidatePath(`${DRIVER_PLANS_PATH}/${planId}`)
  return { ok: true }
}

export async function assignDriverSubscriptionAction(
  userId: string,
  planId: string,
  status: DriverSubscriptionStatus,
): Promise<DriverPlanActionResult> {
  if (!planId.trim()) {
    return { ok: false, errorKey: 'validation.planRequired' }
  }
  if (!DRIVER_SUBSCRIPTION_STATUSES.includes(status)) {
    return { ok: false, errorKey: 'validation.statusInvalid' }
  }

  try {
    await assignDriverSubscription(userId, { planId, status })
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(`/admin/users/${userId}`)
  return { ok: true }
}

export async function setDriverEntitlementOverrideAction(
  userId: string,
  override: DriverEntitlementOverride | null,
): Promise<DriverPlanActionResult> {
  if (override !== null) {
    const parsed = driverEntitlementOverrideSchema.safeParse(override)
    if (!parsed.success) {
      return { ok: false, errorKey: parsed.error.issues[0]?.message ?? 'errors.invalidConfig' }
    }
  }

  try {
    await setDriverEntitlementOverride(userId, override)
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(`/admin/users/${userId}`)
  return { ok: true }
}
