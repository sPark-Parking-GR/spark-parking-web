import { z } from 'zod'
import { LEGAL_VERSION_PATTERN } from '@spark/types'

export const legalAcceptanceFields = z.object({
  legalAccepted: z.literal(true),
  termsVersion: z.string().regex(LEGAL_VERSION_PATTERN),
  privacyVersion: z.string().regex(LEGAL_VERSION_PATTERN),
})

export type LegalAcceptanceFields = z.infer<typeof legalAcceptanceFields>

export function readLegalFields(formData: FormData) {
  return {
    legalAccepted: formData.get('legalAccepted') === 'yes',
    termsVersion: String(formData.get('termsVersion') ?? ''),
    privacyVersion: String(formData.get('privacyVersion') ?? ''),
  }
}

/** The API's wire shape for a recorded acceptance. */
export function toLegalAcceptance(fields: LegalAcceptanceFields) {
  return { terms: fields.termsVersion, privacy: fields.privacyVersion }
}
