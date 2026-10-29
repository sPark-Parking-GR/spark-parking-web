import { beforeEach, describe, expect, it, vi } from 'vitest'

const setIngestionBacklog = vi.fn()
const retryFailedTiles = vi.fn()
const runPromotion = vi.fn()
const runReclassify = vi.fn()
const getActiveSession = vi.fn()
const revalidatePath = vi.fn()

vi.mock('./api', () => {
  class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message)
    }
  }
  class AuthRequiredError extends Error {}
  return { ApiError, AuthRequiredError }
})
vi.mock('./ingestion-api', () => ({
  setIngestionBacklog: (...args: unknown[]) => setIngestionBacklog(...args),
  retryFailedTiles: (...args: unknown[]) => retryFailedTiles(...args),
  runPromotion: (...args: unknown[]) => runPromotion(...args),
  runReclassify: (...args: unknown[]) => runReclassify(...args),
}))
vi.mock('./session', () => ({ getActiveSession: () => getActiveSession() }))
vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }))
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`)
  },
}))

import { ApiError, AuthRequiredError } from './api'
import {
  retryFailedTilesAction,
  runPromotionAction,
  runReclassifyAction,
  setIngestionBacklogAction,
} from './ingestion-actions'

function sessionAs(role: string | null) {
  getActiveSession.mockResolvedValue(
    role === null ? {} : { user: { id: 'u1', email: 'a@b.co', role, emailVerified: true } },
  )
}

beforeEach(() => {
  for (const mock of [setIngestionBacklog, retryFailedTiles, runPromotion, runReclassify]) {
    mock.mockReset().mockResolvedValue({})
  }
  getActiveSession.mockReset()
  revalidatePath.mockReset()
  sessionAs('platform_admin')
})

describe('permission gate', () => {
  it.each([null, 'user', 'operator_admin', 'operator_staff'])(
    'refuses %s without calling the API',
    async (role) => {
      sessionAs(role)

      for (const action of [
        () => setIngestionBacklogAction(true),
        retryFailedTilesAction,
        runPromotionAction,
        runReclassifyAction,
      ]) {
        expect(await action()).toEqual({ ok: false, errorKey: 'errors.forbidden' })
      }
      expect(setIngestionBacklog).not.toHaveBeenCalled()
      expect(retryFailedTiles).not.toHaveBeenCalled()
      expect(runPromotion).not.toHaveBeenCalled()
      expect(runReclassify).not.toHaveBeenCalled()
    },
  )

  it.each(['platform_admin', 'super_admin'])('admits %s', async (role) => {
    sessionAs(role)
    expect(await setIngestionBacklogAction(true)).toEqual({ ok: true })
  })
})

describe('setIngestionBacklogAction', () => {
  it('forwards the flag and refreshes the page', async () => {
    expect(await setIngestionBacklogAction(false)).toEqual({ ok: true })
    expect(setIngestionBacklog).toHaveBeenCalledWith(false)
    expect(revalidatePath).toHaveBeenCalledWith('/admin/ingestion')
  })

  it('rejects a non-boolean from a forged call', async () => {
    expect(await setIngestionBacklogAction('yes' as unknown as boolean)).toEqual({
      ok: false,
      errorKey: 'errors.genericError',
    })
    expect(setIngestionBacklog).not.toHaveBeenCalled()
  })
})

describe('retryFailedTilesAction', () => {
  it('returns how many tiles were re-queued', async () => {
    retryFailedTiles.mockResolvedValue({ retried: 7, remaining: 3 })
    expect(await retryFailedTilesAction()).toEqual({ ok: true, retried: 7, remaining: 3 })
  })
})

describe('error mapping', () => {
  it.each([
    [403, 'errors.forbidden'],
    [429, 'errors.rateLimited'],
    [503, 'errors.queueUnavailable'],
    [500, 'errors.genericError'],
  ])('maps API status %s to %s', async (status, errorKey) => {
    runPromotion.mockRejectedValue(new ApiError('nope', status))
    expect(await runPromotionAction()).toEqual({ ok: false, errorKey })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('sends a lapsed session to login', async () => {
    runReclassify.mockRejectedValue(new AuthRequiredError())
    await expect(runReclassifyAction()).rejects.toThrow('redirect:/login')
  })

  it('reports a network failure as a generic error', async () => {
    runPromotion.mockRejectedValue(new Error('boom'))
    expect(await runPromotionAction()).toEqual({ ok: false, errorKey: 'errors.genericError' })
  })
})
