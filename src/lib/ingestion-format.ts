import type { CrawlState, IngestionStatus } from './ingestion-types'

export function coveragePercent(planned: number, seeded: number): number {
  if (planned <= 0) return 0
  return Math.min(100, Math.floor((seeded / planned) * 100))
}

export function activeTiles(status: IngestionStatus): number {
  return (status.tiles['PENDING'] ?? 0) + (status.tiles['FETCHING'] ?? 0)
}

// What an admin most needs to know first, most alarming reason first: a dead Redis or a
// missing worker explains an idle crawl better than the switch being off.
export function crawlState(status: IngestionStatus): CrawlState {
  const { control, coverage } = status
  if (control.redis === 'unavailable') return 'unavailable'
  if (control.workers && control.workers.backlog === 0) return 'offline'
  if (!control.backlogEnabled) return 'off'
  const seededAll = coverage.planned > 0 && coverage.seeded >= coverage.planned
  return seededAll && activeTiles(status) === 0 ? 'finished' : 'running'
}

export function namingTotal(naming: Record<string, number>): number {
  return Object.values(naming).reduce((sum, count) => sum + count, 0)
}

// The naming layers in the order the pipeline tries them, so the breakdown reads as a ladder.
export const NAMING_LAYERS = [
  'address',
  'street',
  'near-street',
  'landmark',
  'neighbourhood',
  'settlement',
  'none',
] as const
