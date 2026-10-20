import { describe, expect, it } from 'vitest'
import { emailField } from './email-schema'

describe('emailField', () => {
  it('trims and lower-cases', () => {
    expect(emailField().parse('  Ann@Spark.GR ')).toBe('ann@spark.gr')
  })

  it.each(['', 'plain', 'a@b', 'a..b@spark.gr', 'a b@spark.gr', 'a@x.invalid', '@spark.gr'])(
    'rejects %j with the caller message',
    (value) => {
      const result = emailField('bad').safeParse(value)
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.issues[0]?.message).toBe('bad')
    },
  )
})
