import { redirect } from 'next/navigation'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { getAnalyticsSummary, getRevenueSeries } from '@/lib/analytics-api'
import type { AnalyticsSummary, RevenueSeries } from '@/lib/analytics-api'
import type { ResolvedRange } from '@/lib/date-range'

export type AnalyticsErrorKind = 'mixedCurrency' | 'unknown'

export type Settled<T> = { ok: true; value: T } | { ok: false; error: unknown }

export type AnalyticsResult =
  | { kind: 'ok'; summary: AnalyticsSummary; series: RevenueSeries }
  | { kind: 'error'; error: AnalyticsErrorKind }

// Fetches start in the page and are consumed by independent Suspense sections. Capturing the
// outcome (redirects included) keeps an early rejection from going unhandled before a section
// has rendered; the section rethrows via unwrap so redirect()/notFound() still take effect.
export function settle<T>(run: () => Promise<T>): Promise<Settled<T>> {
  return run().then(
    (value): Settled<T> => ({ ok: true, value }),
    (error: unknown): Settled<T> => ({ ok: false, error }),
  )
}

export function unwrap<T>(result: Settled<T>): T {
  if (!result.ok) throw result.error
  return result.value
}

export async function loadAnalytics({ from, to, bucket }: ResolvedRange): Promise<AnalyticsResult> {
  try {
    const [summary, series] = await Promise.all([
      getAnalyticsSummary({ from: from.toISOString(), to: to.toISOString() }),
      getRevenueSeries({ from: from.toISOString(), to: to.toISOString(), bucket }),
    ])
    return { kind: 'ok', summary, series }
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
    return {
      kind: 'error',
      error: err instanceof ApiError && err.status === 422 ? 'mixedCurrency' : 'unknown',
    }
  }
}
