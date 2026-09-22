import { apiFetch } from './api'
import type {
  BillingInterval,
  EntitlementOverride,
  EntitlementSource,
  Entitlements,
  OperatorUsage,
  SubscriptionLifecycleStatus,
  SubscriptionStatus,
} from '@spark/types'

export interface OperatorPlanView {
  id: string
  code: string
  name: string
  description: string | null
  priceCents: number
  currency: string
  interval: BillingInterval
  entitlements: Entitlements
  isPublic: boolean
  sortOrder: number
  lifecycleStatus: SubscriptionLifecycleStatus
  subscribers: number
}

// Period boundaries arrive as ISO strings over the wire even though the API declares Date.
export interface OperatorSubscriptionView {
  operatorId: string
  entitlements: Entitlements
  usage: OperatorUsage
  source: EntitlementSource
  planCode: string | null
  planName: string | null
  subscriptionId: string | null
  status: SubscriptionStatus | null
  planId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  trialEndsAt: string | null
  cancelAtPeriodEnd: boolean
  providerSubscriptionId: string | null
  entitlementOverride: EntitlementOverride | null
}

export interface OperatorPlanDraft {
  code: string
  name: string
  description: string
  priceCents: number
  currency: string
  interval: BillingInterval
  entitlements: Entitlements
  isPublic: boolean
  sortOrder: number
}

export type CreateOperatorPlanInput = Omit<OperatorPlanDraft, 'description'> & {
  description?: string
}

export type UpdateOperatorPlanInput = Omit<OperatorPlanDraft, 'code'>

export interface AssignSubscriptionInput {
  planId: string
  status: SubscriptionStatus
}

const BASE_PATH = '/admin/subscriptions'

export function listOperatorPlans(
  params: { includeArchived?: boolean } = {},
): Promise<OperatorPlanView[]> {
  const qs = params.includeArchived ? '?includeArchived=true' : ''
  return apiFetch<OperatorPlanView[]>(`${BASE_PATH}/plans${qs}`)
}

// WHY: the admin API exposes no single-plan route — the catalog is small, ordered and
// already carries subscriber counts, so the detail page reads one row out of the list
// rather than the API growing a route that would return exactly the same object.
export async function getOperatorPlan(planId: string): Promise<OperatorPlanView | null> {
  const plans = await listOperatorPlans({ includeArchived: true })
  return plans.find((plan) => plan.id === planId) ?? null
}

export function createOperatorPlan(input: CreateOperatorPlanInput): Promise<OperatorPlanView> {
  return apiFetch<OperatorPlanView>(`${BASE_PATH}/plans`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateOperatorPlan(
  planId: string,
  input: UpdateOperatorPlanInput,
): Promise<OperatorPlanView> {
  return apiFetch<OperatorPlanView>(`${BASE_PATH}/plans/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function archiveOperatorPlan(planId: string, reason?: string): Promise<OperatorPlanView> {
  return apiFetch<OperatorPlanView>(`${BASE_PATH}/plans/${planId}/archive`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  })
}

export function getOperatorSubscription(operatorId: string): Promise<OperatorSubscriptionView> {
  return apiFetch<OperatorSubscriptionView>(`${BASE_PATH}/operators/${operatorId}`)
}

export function assignOperatorSubscription(
  operatorId: string,
  input: AssignSubscriptionInput,
): Promise<OperatorSubscriptionView> {
  return apiFetch<OperatorSubscriptionView>(`${BASE_PATH}/operators/${operatorId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function setOperatorEntitlementOverride(
  operatorId: string,
  entitlementOverride: EntitlementOverride | null,
): Promise<OperatorSubscriptionView> {
  return apiFetch<OperatorSubscriptionView>(`${BASE_PATH}/operators/${operatorId}/override`, {
    method: 'PUT',
    body: JSON.stringify({ entitlementOverride }),
  })
}
