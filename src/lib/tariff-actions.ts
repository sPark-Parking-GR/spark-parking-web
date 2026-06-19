'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ApiError, AuthRequiredError } from './api'
import {
  createTariffPlan,
  updateTariffPlan,
  deleteTariffPlan,
  simulateTariff,
} from './tariff-api'
import { tariffDraftSchema } from './tariff-schema'
import type { SimulateRequest, SimulateResult } from './tariff-api'

const TARIFFS_PATH = '/dashboard/tariffs'

export type TariffActionResult = { ok: true } | { ok: false; error: string }

function mapApiError(err: unknown): TariffActionResult {
  if (err instanceof AuthRequiredError) {
    redirect('/login')
  }
  if (err instanceof ApiError) {
    if (err.status === 403) return { ok: false, error: 'You are not allowed to manage this plan.' }
    if (err.status === 404) return { ok: false, error: 'Tariff plan or facility not found.' }
    // WHY: 400 from the pricing engine carries a safe, operator-facing schedule
    // validation message (e.g. "windows do not cover 24h") — surface it verbatim.
    if (err.status === 400) {
      return { ok: false, error: err.message || 'Invalid tariff configuration. Check the schedule and rate grid.' }
    }
  }
  return { ok: false, error: 'Something went wrong. Please try again.' }
}

function listHref(facilityId: string): string {
  return `${TARIFFS_PATH}?facilityId=${encodeURIComponent(facilityId)}`
}

export async function saveTariffPlanAction(
  facilityId: string,
  planId: string | null,
  _prev: TariffActionResult,
  formData: FormData,
): Promise<TariffActionResult> {
  const rawDraft = formData.get('draft')
  if (typeof rawDraft !== 'string') {
    return { ok: false, error: 'Missing draft payload.' }
  }

  let json: unknown
  try {
    json = JSON.parse(rawDraft)
  } catch {
    return { ok: false, error: 'Draft payload is not valid JSON.' }
  }

  const parsed = tariffDraftSchema.safeParse(json)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid tariff configuration.' }
  }

  try {
    if (planId) {
      await updateTariffPlan(facilityId, planId, parsed.data)
    } else {
      await createTariffPlan(facilityId, parsed.data)
    }
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(TARIFFS_PATH)
  if (planId) {
    revalidatePath(`${TARIFFS_PATH}/${planId}`)
  }
  redirect(listHref(facilityId))
}

export async function deleteTariffPlanAction(
  facilityId: string,
  planId: string,
): Promise<void> {
  try {
    await deleteTariffPlan(facilityId, planId)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    return
  }

  revalidatePath(TARIFFS_PATH)
  redirect(listHref(facilityId))
}

export async function simulateTariffAction(
  facilityId: string,
  body: SimulateRequest,
): Promise<SimulateResult> {
  const parsed = tariffDraftSchema.safeParse(body.draft)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Fix the tariff configuration to preview a quote.' }
  }

  if (Number.isNaN(Date.parse(body.startsAt)) || Number.isNaN(Date.parse(body.endsAt))) {
    return { ok: false, error: 'Enter a valid start and end time.' }
  }
  if (Date.parse(body.startsAt) >= Date.parse(body.endsAt)) {
    return { ok: false, error: 'End time must be after start time.' }
  }

  try {
    return await simulateTariff(facilityId, { ...body, draft: parsed.data })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      return { ok: false, error: err.message || 'Could not compute a quote.' }
    }
    return { ok: false, error: 'Could not compute a quote.' }
  }
}
