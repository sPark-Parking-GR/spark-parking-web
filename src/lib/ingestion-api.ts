import { apiFetch } from './api'
import type { IngestionStatus } from './ingestion-types'

export function getIngestionStatus(): Promise<IngestionStatus> {
  return apiFetch<IngestionStatus>('/ingestion/status')
}

export function setIngestionBacklog(enabled: boolean): Promise<{ enabled: boolean }> {
  return apiFetch<{ enabled: boolean }>('/ingestion/backlog', {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  })
}

export function retryFailedTiles(): Promise<{ retried: number; remaining: number }> {
  return apiFetch<{ retried: number; remaining: number }>('/ingestion/retry-failed', {
    method: 'POST',
  })
}

export function runPromotion(): Promise<{ queued: boolean }> {
  return apiFetch<{ queued: boolean }>('/ingestion/promote', { method: 'POST' })
}

export function runReclassify(): Promise<{ queued: boolean }> {
  return apiFetch<{ queued: boolean }>('/ingestion/reclassify', { method: 'POST' })
}
