import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiFetch = vi.fn()
const getActiveSession = vi.fn()

vi.mock('./api', () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }))
vi.mock('./session', () => ({ getActiveSession: () => getActiveSession() }))

import { getMobileUser, listMobileUsers } from './mobile-user-api'
import { MobileAccessDeniedError } from './mobile-user-access'

const listBody = {
  items: [
    {
      id: 'cm1',
      email: 'rider@example.com',
      displayName: 'Rider',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastActiveAt: null,
      methods: ['password'],
      hasPassword: true,
      bookingCount: 0,
    },
  ],
  total: 1,
}

function sessionAs(role: string) {
  getActiveSession.mockResolvedValue({ accessToken: 'tok', user: { id: 'u', role } })
}

beforeEach(() => {
  apiFetch.mockReset()
  getActiveSession.mockReset()
})

describe('listMobileUsers', () => {
  it('denies platform_admin before touching the API', async () => {
    sessionAs('platform_admin')
    await expect(listMobileUsers({})).rejects.toBeInstanceOf(MobileAccessDeniedError)
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('builds the query string from the contract parameter names', async () => {
    sessionAs('super_admin')
    apiFetch.mockResolvedValue(listBody)
    await listMobileUsers({
      search: ' rid ',
      status: 'SUSPENDED',
      provider: 'google',
      skip: 20,
      take: 20,
    })
    expect(apiFetch).toHaveBeenCalledWith(
      '/admin/mobile-users?search=rid&status=SUSPENDED&provider=google&skip=20&take=20',
    )
  })

  it('omits the query string when nothing is filtered', async () => {
    sessionAs('super_admin')
    apiFetch.mockResolvedValue(listBody)
    await listMobileUsers({})
    expect(apiFetch).toHaveBeenCalledWith('/admin/mobile-users')
  })

  it('rejects a response that breaks the contract', async () => {
    sessionAs('super_admin')
    apiFetch.mockResolvedValue({ items: [{ id: 'x' }], total: 1 })
    await expect(listMobileUsers({})).rejects.toThrow()
  })
})

describe('getMobileUser', () => {
  it('denies platform_admin', async () => {
    sessionAs('platform_admin')
    await expect(getMobileUser('cm1')).rejects.toBeInstanceOf(MobileAccessDeniedError)
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('refuses an id that is not a plain identifier', async () => {
    sessionAs('super_admin')
    await expect(getMobileUser('../admin')).rejects.toThrow()
    expect(apiFetch).not.toHaveBeenCalled()
  })
})
