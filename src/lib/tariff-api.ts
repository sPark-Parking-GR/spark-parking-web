import { apiFetch } from './api'
import type { ManagersResponse } from './api'
import type { VehicleType } from '@spark/types'
import type { LifecycleItemStatus } from './lifecycle-constants'

export type TariffPlanLifecycleStatus = 'ACTIVE' | LifecycleItemStatus

export type TariffUnit = 'per_minute' | 'per_block' | 'flat'
export type CapScope = 'stay' | 'rolling'

export interface TariffTier {
  key: string
  fromMinute: number
  toMinute: number | null
  unit: TariffUnit
  blockMinutes: number | null
}

export interface TariffWindow {
  key: string
  label: string
  dayMask: number
  startMinute: number
  endMinute: number
}

export interface TariffRate {
  tierKey: string
  windowKey: string
  priceCents: number
  currency: string
}

export interface TariffCap {
  windowMinutes: number
  capCents: number
  scope: CapScope
}

export interface TariffDraft {
  name: string
  operatorId?: string
  isActive: boolean
  isDefault: boolean
  validFrom: string | null
  validTo: string | null
  timezone: string
  graceMinutes: number
  incrementMinutes: number
  vehicleTypes: VehicleType[]
  tiers: TariffTier[]
  windows: TariffWindow[]
  rates: TariffRate[]
  caps: TariffCap[]
}

export interface TariffPlanListItem {
  id: string
  operatorId: string
  operatorName: string
  name: string
  isActive: boolean
  isDefault: boolean
  lifecycleStatus: TariffPlanLifecycleStatus
  validFrom: string | null
  validTo: string | null
  vehicleTypes: VehicleType[]
  version: number
  updatedAt: string
}

export interface TariffPlanDetail extends TariffDraft {
  id: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface PlanAssignment {
  id: string
  name: string
}

export interface PlanAssignments {
  facilities: PlanAssignment[]
  count: number
  isDefault: boolean
  implicitFacilityCount: number
}

export interface SimLineItem {
  label: string
  durationMinutes: number
  unitPriceCents: number
  quantity: number
  subtotalCents: number
}

export interface SimulateQuote {
  durationMinutes: number
  billableMinutes: number
  lineItems: SimLineItem[]
  totalCents: number
  currency: string
}

export interface SimulateRequest {
  draft: TariffDraft
  startsAt: string
  endsAt: string
  vehicleType: VehicleType
}

export type SimulateResult = { ok: true; quote: SimulateQuote } | { ok: false; error: string }

const PLANS_PATH = '/tariff-plans'

// `operatorId` narrows the cross-operator list a platform admin sees; the API ignores it
// for operator callers, whose own scope already restricts them to their plans.
export function listTariffPlans(
  params: { operatorId?: string } = {},
): Promise<{ items: TariffPlanListItem[] }> {
  const qs = params.operatorId ? `?operatorId=${encodeURIComponent(params.operatorId)}` : ''
  return apiFetch<{ items: TariffPlanListItem[] }>(`${PLANS_PATH}${qs}`)
}

export function getTariffPlan(planId: string): Promise<TariffPlanDetail> {
  return apiFetch<TariffPlanDetail>(`${PLANS_PATH}/${planId}`)
}

export function getTariffAssignments(planId: string): Promise<PlanAssignments> {
  return apiFetch<PlanAssignments>(`${PLANS_PATH}/${planId}/assignments`)
}

export function createTariffPlan(draft: TariffDraft): Promise<TariffPlanDetail> {
  return apiFetch<TariffPlanDetail>(PLANS_PATH, {
    method: 'POST',
    body: JSON.stringify(draft),
  })
}

export function updateTariffPlan(
  planId: string,
  draft: TariffDraft,
  newDefaultPlanId?: string,
): Promise<TariffPlanDetail> {
  const qs = newDefaultPlanId ? `?newDefaultPlanId=${encodeURIComponent(newDefaultPlanId)}` : ''
  return apiFetch<TariffPlanDetail>(`${PLANS_PATH}/${planId}${qs}`, {
    method: 'PATCH',
    body: JSON.stringify(draft),
  })
}

export function deleteTariffPlan(planId: string, newDefaultPlanId?: string): Promise<void> {
  const qs = newDefaultPlanId ? `?newDefaultPlanId=${encodeURIComponent(newDefaultPlanId)}` : ''
  return apiFetch<void>(`${PLANS_PATH}/${planId}${qs}`, { method: 'DELETE' })
}

export function simulateTariff(body: SimulateRequest): Promise<SimulateResult> {
  return apiFetch<SimulateResult>(`${PLANS_PATH}/simulate`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getTariffPlanManagers(planId: string): Promise<ManagersResponse> {
  return apiFetch<ManagersResponse>(`${PLANS_PATH}/${planId}/managers`)
}

export function updateTariffPlanManagers(
  planId: string,
  userIds: string[],
): Promise<ManagersResponse> {
  return apiFetch<ManagersResponse>(`${PLANS_PATH}/${planId}/managers`, {
    method: 'PUT',
    body: JSON.stringify({ userIds }),
  })
}
