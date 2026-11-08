import { describe, expect, it } from 'vitest'
import { DASHBOARD_HOME, safeReturnPath } from './safe-return-path'

describe('safeReturnPath', () => {
  it.each([
    ['/dashboard/bookings'],
    ['/dashboard/bookings?status=open'],
    ['/admin/operators/42'],
    ['/'],
  ])('keeps the same-origin path %s', (from) => {
    expect(safeReturnPath(from)).toBe(from)
  })

  it.each([
    ['undefined', undefined],
    ['empty', ''],
    ['relative', 'dashboard'],
    ['absolute URL', 'https://evil.example/phish'],
    ['protocol-relative', '//evil.example'],
    ['backslash-smuggled', '/\\evil.example'],
    ['javascript scheme', 'javascript:alert(1)'],
  ])('falls back to the dashboard for %s', (_name, from) => {
    expect(safeReturnPath(from)).toBe(DASHBOARD_HOME)
  })
})
