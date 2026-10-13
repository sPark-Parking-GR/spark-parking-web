import { describe, expect, it } from 'vitest'
import { hasPlatformPermission } from '@spark/types'
import { navForAdmin, navForPlatformAdmin } from './nav'

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
