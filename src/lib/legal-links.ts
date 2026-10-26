import type { LegalDocument } from '@spark/types'

const LEGAL_BASE_URL = (
  process.env['NEXT_PUBLIC_LEGAL_BASE_URL'] ?? 'https://sparkparking.gr'
).replace(/\/+$/, '')

/** The brand site serves Greek at the root and English under /en/. */
export function legalUrl(locale: string, document: LegalDocument): string {
  return `${LEGAL_BASE_URL}${locale === 'el' ? '' : '/en'}/${document}/`
}
