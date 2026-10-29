export interface QueueCounts {
  waiting: number
  active: number
  delayed: number
  failed: number
}

export type BacklogTickResult =
  { paused: true } | { inFlight: number; retried: number; seeded: number; promotionQueued: boolean }

export interface IngestionControl {
  backlogEnabled: boolean
  redis: 'ok' | 'unavailable'
  workers: { fetch: number; promote: number; backlog: number } | null
  queues: { fetch: QueueCounts; promote: QueueCounts } | null
  lastTick: { at: string; result: BacklogTickResult | null } | null
  nextTickAt: string | null
}

export interface IngestionFailure {
  south: number
  west: number
  north: number
  east: number
  error: string | null
}

export interface IngestionStatus {
  tiles: Record<string, number>
  rawPlaces: Record<string, number>
  coverage: { planned: number; seeded: number }
  facilities: { published: number; unpublished: number }
  naming: Record<string, number>
  recentFailures: IngestionFailure[]
  control: IngestionControl
}

export type CrawlState = 'unavailable' | 'offline' | 'off' | 'finished' | 'running'
