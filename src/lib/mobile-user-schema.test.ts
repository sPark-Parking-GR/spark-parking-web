import { describe, expect, it } from 'vitest'
import {
  mobileEraseSchema,
  mobileReasonSchema,
  mobileUserDetailSchema,
  mobileUserIdSchema,
  mobileUserListQuerySchema,
  mobileUserListSchema,
} from './mobile-user-schema'

const summary = {
  id: 'cm1',
  email: 'rider@example.com',
  displayName: null,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastActiveAt: null,
  methods: ['password', 'google'],
  hasPassword: true,
  bookingCount: 3,
}

describe('mobileUserListSchema', () => {
  it('accepts the list contract and normalises enum casing', () => {
    const parsed = mobileUserListSchema.parse({
      items: [{ ...summary, status: 'suspended', methods: ['PASSWORD', 'Apple'] }],
      total: 1,
    })
    expect(parsed.items[0]?.status).toBe('SUSPENDED')
    expect(parsed.items[0]?.methods).toEqual(['password', 'apple'])
  })

  it('rejects an unknown status or provider', () => {
    expect(() =>
      mobileUserListSchema.parse({ items: [{ ...summary, status: 'BANNED' }], total: 1 }),
    ).toThrow()
    expect(() =>
      mobileUserListSchema.parse({ items: [{ ...summary, methods: ['github'] }], total: 1 }),
    ).toThrow()
  })

  it('rejects a response missing total', () => {
    expect(() => mobileUserListSchema.parse({ items: [] })).toThrow()
  })
})

describe('mobileUserDetailSchema', () => {
  const detail = {
    ...summary,
    methods: [
      {
        provider: 'google',
        email: 'g@example.com',
        createdAt: summary.createdAt,
        lastUsedAt: null,
      },
    ],
    profile: { appVersion: '1.2.0', locale: 'el', lastActiveAt: null },
    counts: { bookings: 3, vehicles: 1, savedFacilities: 0, reviews: 2 },
    subscription: null,
  }

  it('accepts a full detail payload', () => {
    expect(mobileUserDetailSchema.parse(detail).counts.reviews).toBe(2)
  })

  it('accepts a missing profile and a populated subscription', () => {
    const parsed = mobileUserDetailSchema.parse({
      ...detail,
      profile: null,
      subscription: { status: 'ACTIVE', planName: 'Plus', currentPeriodEnd: null },
    })
    expect(parsed.profile).toBeNull()
    expect(parsed.subscription?.planName).toBe('Plus')
  })

  it('drops fields outside the contract, such as push tokens', () => {
    const parsed = mobileUserDetailSchema.parse({
      ...detail,
      pushToken: 'secret',
      passwordHash: 'x',
    })
    expect(parsed).not.toHaveProperty('pushToken')
    expect(parsed).not.toHaveProperty('passwordHash')
  })
})

describe('mobileReasonSchema', () => {
  it('trims and enforces the bounds', () => {
    expect(mobileReasonSchema.parse('  abuse  ')).toBe('abuse')
    expect(mobileReasonSchema.safeParse('  ab ').success).toBe(false)
    expect(mobileReasonSchema.safeParse('x'.repeat(501)).success).toBe(false)
  })
})

describe('mobileEraseSchema', () => {
  it('lowercases the confirmation email', () => {
    expect(
      mobileEraseSchema.parse({ reason: 'gdpr', confirmEmail: ' Rider@Example.com ' }),
    ).toEqual({ reason: 'gdpr', confirmEmail: 'rider@example.com' })
  })

  it('requires both a reason and a well-formed email', () => {
    expect(mobileEraseSchema.safeParse({ reason: 'gdpr', confirmEmail: 'nope' }).success).toBe(
      false,
    )
    expect(mobileEraseSchema.safeParse({ reason: '', confirmEmail: 'a@b.co' }).success).toBe(false)
  })
})

describe('mobileUserIdSchema', () => {
  it('refuses ids that could alter the request path', () => {
    expect(mobileUserIdSchema.safeParse('cm1abc').success).toBe(true)
    expect(mobileUserIdSchema.safeParse('../users').success).toBe(false)
    expect(mobileUserIdSchema.safeParse('a/b').success).toBe(false)
    expect(mobileUserIdSchema.safeParse('').success).toBe(false)
  })
})

describe('mobileUserListQuerySchema', () => {
  it('bounds take and rejects unknown filters', () => {
    expect(mobileUserListQuerySchema.safeParse({ take: 101 }).success).toBe(false)
    expect(mobileUserListQuerySchema.safeParse({ search: 'a' }).success).toBe(false)
    expect(mobileUserListQuerySchema.safeParse({ status: 'WAT' }).success).toBe(false)
    expect(
      mobileUserListQuerySchema.safeParse({ skip: 0, take: 20, provider: 'apple' }).success,
    ).toBe(true)
  })
})
