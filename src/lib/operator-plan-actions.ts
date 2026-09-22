'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ApiError, AuthRequiredError } from './api'
import {
  archiveOperatorPlan,
  assignOperatorSubscription,
  createOperatorPlan,
  getOperatorSubscription,
  listOperatorPlans,
  setOperatorEntitlementOverride,
  updateOperatorPlan,
} from './operator-plan-api'
import {
  assignSubscriptionDraftSchema,
  entitlementOverrideDraftSchema,
  operatorPlanDraftSchema,
} from './operator-plan-schema'
import type { OperatorPlanView, OperatorSubscriptionView } from './operator-plan-api'
import type { EntitlementOverride, SubscriptionStatus } from '@spark/types'

const PLANS_PATH = '/admin/operator-plans'
const OPERATORS_PATH = '/admin/operators'

export type OperatorPlanActionResult =
  | { ok: true }
  | { ok: false; errorKey: string; detail?: string }

function mapApiError(err: unknown): OperatorPlanActionResult {
  if (err instanceof AuthRequiredError) {
    redirect('/login')
  }
  if (err instanceof ApiError) {
    if (err.status === 403) return { ok: false, errorKey: 'errors.forbidden' }
    if (err.status === 404) return { ok: false, errorKey: 'errors.notFound' }
    // WHY: every 409 this surface can raise — plan code taken, plan still subscribed to,
    // the starter default, a downgrade that would strand existing resources — arrives with
    // a message that already names what blocks it. Re-deriving that from the status code
    // would lose the only part an administrator can act on.
    if (err.status === 409) {
      return { ok: false, errorKey: 'errors.conflict', detail: err.message || undefined }
    }
    if (err.status === 400) {
      return { ok: false, errorKey: 'errors.invalidData', detail: err.message || undefined }
    }
  }
  return { ok: false, errorKey: 'errors.genericError' }
}

export async function saveOperatorPlanAction(
  planId: string | null,
  _prev: OperatorPlanActionResult,
  formData: FormData,
): Promise<OperatorPlanActionResult> {
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

  const parsed = operatorPlanDraftSchema.safeParse(json)
  if (!parsed.success) {
    return { ok: false, errorKey: parsed.error.issues[0]?.message ?? 'errors.invalidConfig' }
  }

  const { code, description, ...rest } = parsed.data

  try {
    if (planId) {
      // Sent even when empty: the API treats an omitted description as "leave it alone",
      // so omitting it would make a cleared description unsavable.
      await updateOperatorPlan(planId, { ...rest, description })
    } else {
      await createOperatorPlan({ code, ...rest, ...(description ? { description } : {}) })
    }
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(PLANS_PATH)
  if (planId) {
    revalidatePath(`${PLANS_PATH}/${planId}`)
  }
  redirect(PLANS_PATH)
}

export async function archiveOperatorPlanAction(
  planId: string,
  reason?: string,
): Promise<OperatorPlanActionResult> {
  const trimmed = reason?.trim()

  try {
    await archiveOperatorPlan(planId, trimmed ? trimmed : undefined)
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(PLANS_PATH)
  revalidatePath(`${PLANS_PATH}/${planId}`)
  return { ok: true }
}

export interface OperatorBilling {
  subscription: OperatorSubscriptionView
  plans: OperatorPlanView[]
}

/**
 * Swallows 403/404 to null so the operator detail page renders without the panel rather
 * than failing whole, mirroring how the tariff managers panel is loaded.
 */
export async function getOperatorBillingAction(
  operatorId: string,
): Promise<OperatorBilling | null> {
  try {
    const [subscription, plans] = await Promise.all([
      getOperatorSubscription(operatorId),
      listOperatorPlans(),
    ])
    return { subscription, plans }
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    return null
  }
}

export async function assignOperatorPlanAction(
  operatorId: string,
  planId: string,
  status: SubscriptionStatus,
): Promise<OperatorPlanActionResult> {
  const parsed = assignSubscriptionDraftSchema.safeParse({ planId, status })
  if (!parsed.success) {
    return { ok: false, errorKey: parsed.error.issues[0]?.message ?? 'errors.invalidConfig' }
  }

  try {
    await assignOperatorSubscription(operatorId, parsed.data)
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(`${OPERATORS_PATH}/${operatorId}`)
  return { ok: true }
}

export async function setOperatorOverrideAction(
  operatorId: string,
  entitlementOverride: EntitlementOverride | null,
): Promise<OperatorPlanActionResult> {
  let payload: EntitlementOverride | null = null
  if (entitlementOverride !== null) {
    const parsed = entitlementOverrideDraftSchema.safeParse(entitlementOverride)
    if (!parsed.success) {
      return { ok: false, errorKey: parsed.error.issues[0]?.message ?? 'errors.invalidConfig' }
    }
    payload = parsed.data
  }

  try {
    await setOperatorEntitlementOverride(operatorId, payload)
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(`${OPERATORS_PATH}/${operatorId}`)
  return { ok: true }
}
