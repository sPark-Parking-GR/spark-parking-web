import 'server-only'
import type { LegalStatus, LegalVersions } from '@spark/types'
import { apiFetch } from './api'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://127.0.0.1:3001/api/v1'

/** Null when the API cannot be reached: callers decide whether that blocks the form. */
export async function fetchLegalVersions(): Promise<LegalVersions | null> {
  try {
    const response = await fetch(`${BASE_URL}/legal/versions`, { cache: 'no-store' })
    if (!response.ok) return null
    return (await response.json()) as LegalVersions
  } catch {
    return null
  }
}

const STATUS_TIMEOUT_MS = 4000

/**
 * Null on any failure. The gate fails open on purpose: a transient API error must not lock
 * every signed-in operator out of the dashboard, and acceptance is still enforced where the
 * account is created. The timeout keeps a stalled API from freezing every page render, since
 * this runs in the dashboard layout and on the accept-terms page.
 */
export async function fetchLegalStatus(): Promise<LegalStatus | null> {
  try {
    return await apiFetch<LegalStatus>('/legal/status', {
      signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
    })
  } catch {
    return null
  }
}
