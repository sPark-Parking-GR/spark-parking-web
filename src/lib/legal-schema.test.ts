import { describe, expect, it } from 'vitest'
import { legalAcceptanceFields, readLegalFields, toLegalAcceptance } from './legal-schema'

function form(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.set(key, value)
  return data
}

describe('legal consent fields', () => {
  it('rejects a submission whose box was not ticked', () => {
    const fields = readLegalFields(form({ termsVersion: '1.0', privacyVersion: '1.0' }))

    expect(legalAcceptanceFields.safeParse(fields).success).toBe(false)
  })

  it('rejects a malformed version', () => {
    const fields = readLegalFields(
      form({ legalAccepted: 'yes', termsVersion: 'latest', privacyVersion: '1.0' }),
    )

    expect(legalAcceptanceFields.safeParse(fields).success).toBe(false)
  })

  it('maps ticked consent to the API shape', () => {
    const fields = readLegalFields(
      form({ legalAccepted: 'yes', termsVersion: '2.1', privacyVersion: '1.0' }),
    )
    const parsed = legalAcceptanceFields.parse(fields)

    expect(toLegalAcceptance(parsed)).toEqual({ terms: '2.1', privacy: '1.0' })
  })
})
