import { apiFetch } from './api'
import type { VehicleType } from '@spark/types'

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
  isDefault: boolean
  isActive: boolean
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
  name: string
  isDefault: boolean
  isActive: boolean
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

export type SimulateResult =
  | { ok: true; quote: SimulateQuote }
  | { ok: false; error: string }

function plansPath(facilityId: string): string {
  return `/facilities/${facilityId}/tariff-plans`
}

export function listTariffPlans(facilityId: string): Promise<{ items: TariffPlanListItem[] }> {
  return apiFetch<{ items: TariffPlanListItem[] }>(plansPath(facilityId))
}

export function getTariffPlan(facilityId: string, planId: string): Promise<TariffPlanDetail> {
  return apiFetch<TariffPlanDetail>(`${plansPath(facilityId)}/${planId}`)
}

export function createTariffPlan(facilityId: string, draft: TariffDraft): Promise<TariffPlanDetail> {
  return apiFetch<TariffPlanDetail>(plansPath(facilityId), {
    method: 'POST',
    body: JSON.stringify(draft),
  })
}

export function updateTariffPlan(
  facilityId: string,
  planId: string,
  draft: TariffDraft,
): Promise<TariffPlanDetail> {
  return apiFetch<TariffPlanDetail>(`${plansPath(facilityId)}/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify(draft),
  })
}

export function deleteTariffPlan(facilityId: string, planId: string): Promise<void> {
  return apiFetch<void>(`${plansPath(facilityId)}/${planId}`, { method: 'DELETE' })
}

export function simulateTariff(facilityId: string, body: SimulateRequest): Promise<SimulateResult> {
  return apiFetch<SimulateResult>(`${plansPath(facilityId)}/simulate`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
