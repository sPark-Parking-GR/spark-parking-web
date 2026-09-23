'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { isPlatformRole } from '@spark/types'
import { ApiError, AuthRequiredError } from './api'
import type { ManagersActionResult, ManagersResponse } from './api'
import {
  createTariffPlan,
  updateTariffPlan,
  deleteTariffPlan,
  simulateTariff,
  getTariffAssignments,
  getTariffPlanManagers,
  updateTariffPlanManagers,
} from './tariff-api'
import { tariffDraftSchema } from './tariff-schema'
import { isEntitlementLimitError } from './plan-limit'
import { getActiveSession } from './session'
import type { SimulateRequest, SimulateQuote, PlanAssignments } from './tariff-api'

// WHY: tariff plans are managed on two surfaces — platform admins from /admin/tariffs,
// operators from /dashboard/tariffs — so revalidation and post-action redirects have to
// follow the caller's own surface instead of a single hardcoded path.
async function tariffsPath(): Promise<string> {
  const session = await getActiveSession()
  const platform = session.user !== undefined && isPlatformRole(session.user.role)
  return platform ? '/admin/tariffs' : '/dashboard/tariffs'
}

export type TariffActionResult =
  | { ok: true }
  | { ok: false; errorKey: string; detail?: string; requiresDefaultReplacement?: boolean }

function mapApiError(err: unknown): TariffActionResult {
  if (err instanceof AuthRequiredError) {
    redirect('/login')
  }
  if (err instanceof ApiError) {
    if (err.status === 403) return { ok: false, errorKey: 'errors.forbidden' }
    if (err.status === 404) return { ok: false, errorKey: 'errors.notFound' }
    if (err.status === 409) {
      // A quota refusal only ever happens on create (no default-plan replacement makes
      // sense there), while every other 409 here comes from removing an in-use default —
      // keep the two apart so the plan-limit one gets an upgrade CTA, not the replacement modal.
      if (isEntitlementLimitError(err)) {
        return { ok: false, errorKey: 'errors.limitExceeded', detail: err.message || undefined }
      }
      return {
        ok: false,
        errorKey: 'errors.genericError',
        detail: err.message,
        requiresDefaultReplacement: true,
      }
    }
    // WHY: 400 from the pricing engine carries a safe, operator-facing schedule
    // validation message (e.g. "windows do not cover 24h") — surface it verbatim.
    if (err.status === 400) {
      return {
        ok: false,
        errorKey: 'errors.scheduleInvalid',
        detail: err.message || undefined,
      }
    }
  }
  return { ok: false, errorKey: 'errors.genericError' }
}

export async function saveTariffPlanAction(
  planId: string | null,
  newDefaultPlanId: string | undefined,
  _prev: TariffActionResult,
  formData: FormData,
): Promise<TariffActionResult> {
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

  const parsed = tariffDraftSchema.safeParse(json)
  if (!parsed.success) {
    return { ok: false, errorKey: parsed.error.issues[0]?.message ?? 'errors.invalidConfig' }
  }

  try {
    if (planId) {
      await updateTariffPlan(planId, parsed.data, newDefaultPlanId)
    } else {
      await createTariffPlan(parsed.data)
    }
  } catch (err) {
    return mapApiError(err)
  }

  const basePath = await tariffsPath()
  revalidatePath(basePath)
  if (planId) {
    revalidatePath(`${basePath}/${planId}`)
  }
  redirect(basePath)
}

export async function deleteTariffPlanAction(
  planId: string,
  newDefaultPlanId?: string,
): Promise<TariffActionResult> {
  try {
    await deleteTariffPlan(planId, newDefaultPlanId)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    return mapApiError(err)
  }

  const basePath = await tariffsPath()
  revalidatePath(basePath)
  redirect(basePath)
}

export async function getTariffAssignmentsAction(planId: string): Promise<PlanAssignments | null> {
  try {
    return await getTariffAssignments(planId)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    return null
  }
}

export async function getTariffPlanManagersAction(
  planId: string,
): Promise<ManagersResponse | null> {
  try {
    return await getTariffPlanManagers(planId)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    return null
  }
}

export async function updateTariffPlanManagersAction(
  planId: string,
  userIds: string[],
): Promise<ManagersActionResult> {
  try {
    const data = await updateTariffPlanManagers(planId, userIds)
    revalidatePath(`${await tariffsPath()}/${planId}`)
    return { ok: true, data }
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      if (err.status === 403) return { ok: false, errorKey: 'managers.errors.forbidden' }
      if (err.status === 404) return { ok: false, errorKey: 'managers.errors.notFound' }
      if (err.status === 400) {
        return {
          ok: false,
          errorKey: 'managers.errors.invalidUsers',
          detail: err.message || undefined,
        }
      }
    }
    return { ok: false, errorKey: 'errors.genericError' }
  }
}

export type SimulateActionResult =
  { ok: true; quote: SimulateQuote } | { ok: false; errorKey: string; detail?: string }

export async function simulateTariffAction(body: SimulateRequest): Promise<SimulateActionResult> {
  const parsed = tariffDraftSchema.safeParse(body.draft)
  if (!parsed.success) {
    return {
      ok: false,
      errorKey: parsed.error.issues[0]?.message ?? 'errors.fixConfigToPreview',
    }
  }

  if (Number.isNaN(Date.parse(body.startsAt)) || Number.isNaN(Date.parse(body.endsAt))) {
    return { ok: false, errorKey: 'errors.invalidWindow' }
  }
  if (Date.parse(body.startsAt) >= Date.parse(body.endsAt)) {
    return { ok: false, errorKey: 'errors.endBeforeStart' }
  }

  try {
    const result = await simulateTariff({ ...body, draft: parsed.data })
    if (result.ok) return { ok: true, quote: result.quote }
    return { ok: false, errorKey: 'errors.quoteFailed', detail: result.error }
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      return { ok: false, errorKey: 'errors.quoteFailed', detail: err.message || undefined }
    }
    return { ok: false, errorKey: 'errors.quoteFailed' }
  }
}
