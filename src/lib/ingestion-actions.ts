'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { hasPlatformPermission } from '@spark/types'
import { ApiError, AuthRequiredError } from './api'
import { retryFailedTiles, runPromotion, runReclassify, setIngestionBacklog } from './ingestion-api'
import { getActiveSession } from './session'

const PAGE_PATH = '/admin/ingestion'

export type IngestionErrorKey =
  'errors.forbidden' | 'errors.rateLimited' | 'errors.queueUnavailable' | 'errors.genericError'

export type IngestionActionResult =
  { ok: true; retried?: number; remaining?: number } | { ok: false; errorKey: IngestionErrorKey }

function failure(errorKey: IngestionErrorKey): IngestionActionResult {
  return { ok: false, errorKey }
}

// The API enforces the same permission; checking here too keeps a forged action call from
// reaching it at all.
async function run(
  operation: () => Promise<{ retried?: number; remaining?: number } | unknown>,
): Promise<IngestionActionResult> {
  const session = await getActiveSession()
  if (!session.user || !hasPlatformPermission(session.user.role, 'platform:tenant.write')) {
    return failure('errors.forbidden')
  }

  let outcome: unknown
  try {
    outcome = await operation()
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      if (err.status === 403) return failure('errors.forbidden')
      if (err.status === 429) return failure('errors.rateLimited')
      if (err.status === 503) return failure('errors.queueUnavailable')
    }
    return failure('errors.genericError')
  }

  revalidatePath(PAGE_PATH)
  const counts = outcome as { retried?: unknown; remaining?: unknown } | null
  return {
    ok: true,
    ...(typeof counts?.retried === 'number' ? { retried: counts.retried } : {}),
    ...(typeof counts?.remaining === 'number' ? { remaining: counts.remaining } : {}),
  }
}

export async function setIngestionBacklogAction(enabled: boolean): Promise<IngestionActionResult> {
  if (typeof enabled !== 'boolean') return failure('errors.genericError')
  return run(() => setIngestionBacklog(enabled))
}

export async function retryFailedTilesAction(): Promise<IngestionActionResult> {
  return run(retryFailedTiles)
}

export async function runPromotionAction(): Promise<IngestionActionResult> {
  return run(runPromotion)
}

export async function runReclassifyAction(): Promise<IngestionActionResult> {
  return run(runReclassify)
}
