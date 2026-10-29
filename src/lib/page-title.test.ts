import { describe, expect, it } from 'vitest'
import { pageTitleKeyFor } from './page-title'

describe('pageTitleKeyFor', () => {
  it('maps a menu route to its nav label', () => {
    expect(pageTitleKeyFor('/admin/operator-plans')).toEqual({
      namespace: 'nav',
      key: 'operatorPlans',
    })
  })

  it('maps detail pages to their parent menu', () => {
    expect(pageTitleKeyFor('/admin/facilities/42')).toEqual({ namespace: 'nav', key: 'facilities' })
  })

  it('keeps /dashboard overview distinct from its children', () => {
    expect(pageTitleKeyFor('/dashboard')).toEqual({ namespace: 'nav', key: 'overview' })
    expect(pageTitleKeyFor('/dashboard/team')).toEqual({ namespace: 'nav', key: 'team' })
  })

  it('prefers the more specific prefix', () => {
    expect(pageTitleKeyFor('/invite/admin/accept/tok')).toEqual({
      namespace: 'documentTitle',
      key: 'acceptAdminInvite',
    })
  })

  it('returns null for unknown routes', () => {
    expect(pageTitleKeyFor('/nope')).toBeNull()
  })
})
