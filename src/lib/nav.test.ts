import { describe, expect, it } from 'vitest'
import { hasPlatformPermission } from '@spark/types'
import { navForAdmin, navForOperator, navForPlatformAdmin } from './nav'

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
