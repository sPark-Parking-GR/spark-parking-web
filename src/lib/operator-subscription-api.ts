import { apiFetch } from './api'
import type {
  BillingInterval,
  EntitlementSource,
  Entitlements,
  OperatorUsage,
  SubscriptionStatus,
} from '@spark/types'

export interface OperatorPlanSummary {
  id: string
  code: string
  name: string
  description: string | null
  priceCents: number
  currency: string
  interval: BillingInterval
  entitlements: Entitlements
}

// Period boundaries arrive as ISO strings over the wire even though the API declares Date.
export interface MyOperatorSubscription {
  planCode: string | null
  planName: string | null
  status: SubscriptionStatus | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  trialEndsAt: string | null
  cancelAtPeriodEnd: boolean
  source: EntitlementSource
  entitlements: Entitlements
  usage: OperatorUsage
}

export interface UpgradeRequestInput {
  requestedPlanId?: string
  message?: string
}

export interface OperatorCheckoutSession {
  checkoutUrl: string
}

const BASE_PATH = '/operator-subscriptions'

export function listOperatorPlanCatalog(): Promise<OperatorPlanSummary[]> {
  return apiFetch<OperatorPlanSummary[]>(`${BASE_PATH}/plans`)
}

export function getMyOperatorSubscription(): Promise<MyOperatorSubscription> {
  return apiFetch<MyOperatorSubscription>(`${BASE_PATH}/me`)
}

// The acknowledgement body carries nothing the UI acts on — a non-error status is the
// entire signal, so it is deliberately not given a shape to drift out of sync with.
export function requestOperatorUpgrade(input: UpgradeRequestInput): Promise<unknown> {
  return apiFetch<unknown>(`${BASE_PATH}/upgrade-request`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function requestOperatorCheckout(planId: string): Promise<OperatorCheckoutSession> {
  return apiFetch<OperatorCheckoutSession>(`${BASE_PATH}/checkout`, {
    method: 'POST',
    body: JSON.stringify({ planId }),
  })
}
