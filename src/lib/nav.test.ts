import { describe, expect, it } from 'vitest'
import { hasPlatformPermission } from '@spark/types'
import { groupNavItems, navForAdmin, navForOperator, navForPlatformAdmin, tabItemsFor } from './nav'

const MOBILE_HREF = '/admin/mobile-users'

describe('mobile users navigation', () => {
  it('lists the entry for super_admin only', () => {
    expect(navForAdmin('super_admin').some((item) => item.href === MOBILE_HREF)).toBe(true)
    expect(navForAdmin('platform_admin').some((item) => item.href === MOBILE_HREF)).toBe(false)
    expect(navForPlatformAdmin('platform_admin').some((item) => item.href === MOBILE_HREF)).toBe(
      false,
    )
  })
})

describe('mobile identity permissions', () => {
  const others = ['platform_admin', 'operator_admin', 'operator_staff', 'user', 'guest'] as const

  it.each(['identity:mobile.read', 'identity:mobile.manage'] as const)('%s', (permission) => {
    expect(hasPlatformPermission('super_admin', permission)).toBe(true)
    for (const role of others) {
      expect(hasPlatformPermission(role, permission)).toBe(false)
    }
  })
})

describe('billing system flag navigation', () => {
  const GATED = ['/dashboard/bookings', '/dashboard/scan', '/dashboard/billing']

  it('hides bookings, scan and billing from operators while the flag is off', () => {
    for (const role of ['operator_admin', 'operator_staff'] as const) {
      const hrefs = navForOperator(role, false).map((item) => item.href)
      for (const href of GATED) expect(hrefs).not.toContain(href)
    }
  })

  it('restores them for operators once the flag is on', () => {
    const hrefs = navForOperator('operator_admin', true).map((item) => item.href)
    for (const href of GATED) expect(hrefs).toContain(href)
  })

  it('never filters the platform tier', () => {
    for (const role of ['platform_admin', 'super_admin'] as const) {
      const hrefs = navForPlatformAdmin(role).map((item) => item.href)
      expect(hrefs).toContain('/admin/bookings')
      expect(hrefs).toContain('/dashboard/scan')
    }
  })

  it('lists the settings entry for platform admins', () => {
    expect(navForAdmin('platform_admin').some((item) => item.href === '/admin/settings')).toBe(true)
  })
})

describe('ingestion navigation', () => {
  const HREF = '/admin/ingestion'

  it('is listed for platform admins and super admins only', () => {
    expect(navForAdmin('platform_admin').some((item) => item.href === HREF)).toBe(true)
    expect(navForAdmin('super_admin').some((item) => item.href === HREF)).toBe(true)
    expect(navForPlatformAdmin('platform_admin').some((item) => item.href === HREF)).toBe(true)
  })

  it('stays out of operator and rider sidebars', () => {
    for (const role of ['operator_admin', 'operator_staff'] as const) {
      expect(navForOperator(role, true).some((item) => item.href === HREF)).toBe(false)
      expect(navForAdmin(role).some((item) => item.href === HREF)).toBe(false)
    }
  })
})

describe('sidebar grouping', () => {
  it('lists every platform admin route under the specified groups, in order', () => {
    const groups = groupNavItems(navForPlatformAdmin('super_admin'))
    expect(groups.map((group) => [group.id, group.items.map((item) => item.icon)])).toEqual([
      ['operations', ['overview', 'analytics', 'bookings', 'scan']],
      ['network', ['operatorDirectory', 'facilities', 'tariffs', 'operatorPlans', 'driverPlans']],
      ['review', ['onboarding', 'approvals', 'ingestion']],
      ['accounts', ['users', 'mobileUsers', 'admins']],
      ['system', ['audit', 'trash', 'settings']],
    ])
  })

  it('never adds or drops a route when grouping', () => {
    for (const items of [
      navForPlatformAdmin('platform_admin'),
      navForOperator('operator_admin', true),
      navForOperator('operator_staff', false),
    ]) {
      const grouped = groupNavItems(items).flatMap((group) => group.items.map((i) => i.href))
      expect([...grouped].sort()).toEqual(items.map((item) => item.href).sort())
    }
  })

  it('groups an operator admin under Operations, Manage, Accounts and System', () => {
    const groups = groupNavItems(navForOperator('operator_admin', true))
    expect(groups.map((group) => group.id)).toEqual(['operations', 'manage', 'accounts', 'system'])
  })

  it('omits groups the viewer has no routes in', () => {
    const groups = groupNavItems(navForOperator('operator_staff', false))
    expect(groups.map((group) => group.id)).toEqual(['operations'])
  })
})

describe('phone tab bar items', () => {
  it('offers Home, Bookings, Scan and Analytics to the platform tier, in that order', () => {
    const hrefs = tabItemsFor(navForPlatformAdmin('platform_admin')).map((item) => item.href)
    expect(hrefs).toEqual(['/dashboard', '/admin/bookings', '/dashboard/scan', '/admin/analytics'])
  })

  it('only offers what an operator can reach', () => {
    expect(tabItemsFor(navForOperator('operator_admin', true)).map((i) => i.icon)).toEqual([
      'overview',
      'bookings',
      'scan',
    ])
    expect(tabItemsFor(navForOperator('operator_admin', false)).map((i) => i.icon)).toEqual([
      'overview',
    ])
  })
})
