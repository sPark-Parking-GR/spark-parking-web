import { cache } from 'react'
import { isPlatformRole } from '@spark/types'
import type { UserRole } from '@spark/types'
import { apiFetch } from './api'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://127.0.0.1:3001/api/v1'

export interface SystemFeatures {
  billing: boolean
}

// Unauthenticated on purpose: the API reports the flag to anyone, so the sidebar can be
// decided before any per-role call. Any failure reads as off — a gated surface must never
// appear because the lookup broke.
export const getSystemFeatures = cache(async (): Promise<SystemFeatures> => {
  try {
    const response = await fetch(`${BASE_URL}/system/features`, { cache: 'no-store' })
    if (!response.ok) return { billing: false }
    const body = (await response.json()) as { billing?: unknown }
    return { billing: body.billing === true }
  } catch {
    return { billing: false }
  }
})

/**
 * Whether this role may see bookings, payments and subscriptions. Platform administrators
 * always may; everyone else follows the system flag. The API enforces the same rule, so this
 * only decides what to render.
 */
export async function canAccessBilling(role: UserRole): Promise<boolean> {
  if (isPlatformRole(role)) return true
  return (await getSystemFeatures()).billing
}

export function setBillingEnabled(enabled: boolean): Promise<SystemFeatures> {
  return apiFetch<SystemFeatures>('/admin/system-flags/billing', {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  })
}
