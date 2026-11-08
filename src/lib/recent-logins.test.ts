// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { forgetRecentLogin, readRecentLogins, rememberRecentLogin } from './recent-logins'

describe('recent logins', () => {
  beforeEach(() => window.localStorage.clear())

  it('keeps the latest three, newest first', () => {
    for (const email of ['a@x.gr', 'b@x.gr', 'c@x.gr', 'd@x.gr']) rememberRecentLogin(email)

    expect(readRecentLogins().map((entry) => entry.email)).toEqual(['d@x.gr', 'c@x.gr', 'b@x.gr'])
  })

  it('moves a repeated address to the front without duplicating it, ignoring case', () => {
    rememberRecentLogin('a@x.gr')
    rememberRecentLogin('b@x.gr')
    rememberRecentLogin('A@x.gr')

    expect(readRecentLogins().map((entry) => entry.email)).toEqual(['a@x.gr', 'b@x.gr'])
  })

  it('forgets one address and clears storage when none are left', () => {
    rememberRecentLogin('a@x.gr')
    forgetRecentLogin('a@x.gr')

    expect(readRecentLogins()).toEqual([])
    expect(window.localStorage.getItem('spark-recent-logins')).toBeNull()
  })

  it('reads corrupt or tampered data as empty', () => {
    window.localStorage.setItem('spark-recent-logins', '[{"email":"nope"}]')
    expect(readRecentLogins()).toEqual([])
    window.localStorage.setItem('spark-recent-logins', '{{')
    expect(readRecentLogins()).toEqual([])
  })
})
