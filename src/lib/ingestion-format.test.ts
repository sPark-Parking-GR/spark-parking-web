import { describe, expect, it } from 'vitest'
import { activeTiles, coveragePercent, crawlState, namingTotal } from './ingestion-format'
import type { IngestionControl, IngestionStatus } from './ingestion-types'

const control = (overrides: Partial<IngestionControl> = {}): IngestionControl => ({
  backlogEnabled: true,
  redis: 'ok',
  workers: { fetch: 1, promote: 1, backlog: 1 },
  queues: null,
  lastTick: null,
  nextTickAt: null,
  ...overrides,
})

const status = (overrides: Partial<IngestionStatus> = {}): IngestionStatus => ({
  tiles: {},
  rawPlaces: {},
  coverage: { planned: 100, seeded: 40 },
  facilities: { published: 0, unpublished: 0 },
  naming: {},
  recentFailures: [],
  control: control(),
  ...overrides,
})

describe('coveragePercent', () => {
  it('rounds down so a crawl never reads as done early', () => {
    expect(coveragePercent(200, 199)).toBe(99)
    expect(coveragePercent(100, 40)).toBe(40)
  })

  it('is zero with nothing planned and capped at 100', () => {
    expect(coveragePercent(0, 0)).toBe(0)
    expect(coveragePercent(10, 12)).toBe(100)
  })
})

describe('activeTiles', () => {
  it('counts pending and fetching tiles only', () => {
    expect(
      activeTiles(status({ tiles: { PENDING: 3, FETCHING: 2, FETCHED: 50, FAILED: 4 } })),
    ).toBe(5)
  })
})

describe('crawlState', () => {
  it('reports an unreachable queue before anything else', () => {
    const s = status({
      control: control({ redis: 'unavailable', workers: null, backlogEnabled: false }),
    })
    expect(crawlState(s)).toBe('unavailable')
  })

  it('reports a missing worker even while the switch is on', () => {
    const s = status({ control: control({ workers: { fetch: 0, promote: 0, backlog: 0 } }) })
    expect(crawlState(s)).toBe('offline')
  })

  it('reports off when the worker is up but the switch is off', () => {
    expect(crawlState(status({ control: control({ backlogEnabled: false }) }))).toBe('off')
  })

  it('reports running while areas remain to be queued', () => {
    expect(crawlState(status())).toBe('running')
  })

  it('keeps running while queued tiles are still being fetched', () => {
    const s = status({ coverage: { planned: 10, seeded: 10 }, tiles: { PENDING: 2 } })
    expect(crawlState(s)).toBe('running')
  })

  it('reports finished once everything is queued and fetched', () => {
    const s = status({ coverage: { planned: 10, seeded: 10 }, tiles: { FETCHED: 10 } })
    expect(crawlState(s)).toBe('finished')
  })

  it('never calls an empty plan finished', () => {
    expect(crawlState(status({ coverage: { planned: 0, seeded: 0 } }))).toBe('running')
  })
})

describe('namingTotal', () => {
  it('sums every layer', () => {
    expect(namingTotal({ street: 20, none: 3, landmark: 1 })).toBe(24)
    expect(namingTotal({})).toBe(0)
  })
})
