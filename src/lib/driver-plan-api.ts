import { apiFetch } from './api'
import type {
  DriverEntitlementOverride,
  DriverPlan,
  DriverPlanDraft,
  DriverSubscriptionDetail,
  DriverSubscriptionStatus,
} from './driver-plan-types'

const BASE_PATH = '/admin/driver-subscriptions'

export type CreateDriverPlanInput = DriverPlanDraft

// `code` identifies the plan in provider metadata and audit payloads, so it is fixed at
// creation — the PATCH route rejects it outright.
export type UpdateDriverPlanInput = Omit<DriverPlanDraft, 'code'>

export interface AssignDriverSubscriptionInput {
  planId: string
  status: DriverSubscriptionStatus
  entitlementOverride?: DriverEntitlementOverride | null
}

export function listDriverPlans(
  params: { includeArchived?: boolean } = {},
): Promise<DriverPlan[]> {
  const qs = params.includeArchived ? '?includeArchived=true' : ''
  return apiFetch<DriverPlan[]>(`${BASE_PATH}/plans${qs}`)
}

// The admin API exposes no single-plan read, so the detail page narrows the catalog
// itself; archived rows are included because their edit page must stay reachable.
export async function getDriverPlan(planId: string): Promise<DriverPlan | undefined> {
  const plans = await listDriverPlans({ includeArchived: true })
  return plans.find((plan) => plan.id === planId)
}

export function createDriverPlan(input: CreateDriverPlanInput): Promise<DriverPlan> {
  return apiFetch<DriverPlan>(`${BASE_PATH}/plans`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateDriverPlan(
  planId: string,
  input: UpdateDriverPlanInput,
): Promise<DriverPlan> {
  return apiFetch<DriverPlan>(`${BASE_PATH}/plans/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function archiveDriverPlan(planId: string, reason?: string): Promise<DriverPlan> {
  return apiFetch<DriverPlan>(`${BASE_PATH}/plans/${planId}/archive`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  })
}

export function getDriverSubscription(userId: string): Promise<DriverSubscriptionDetail> {
  return apiFetch<DriverSubscriptionDetail>(`${BASE_PATH}/users/${userId}`)
}

export function assignDriverSubscription(
  userId: string,
  input: AssignDriverSubscriptionInput,
): Promise<DriverSubscriptionDetail> {
  return apiFetch<DriverSubscriptionDetail>(`${BASE_PATH}/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function setDriverEntitlementOverride(
  userId: string,
  entitlementOverride: DriverEntitlementOverride | null,
): Promise<DriverSubscriptionDetail> {
  return apiFetch<DriverSubscriptionDetail>(`${BASE_PATH}/users/${userId}/override`, {
    method: 'PUT',
    body: JSON.stringify({ entitlementOverride }),
  })
}
