export const LEGAL_DOCUMENTS = ['terms', 'privacy'] as const
export type LegalDocument = (typeof LEGAL_DOCUMENTS)[number]

/** `MAJOR.MINOR`. A major bump forces re-acceptance; a minor bump (typo, clarification) does not. */
export const LEGAL_VERSION_PATTERN = /^(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,3})$/

export type LegalVersions = Record<LegalDocument, string>

export interface LegalStatus {
  current: LegalVersions
  /** Documents whose current major version the account has not accepted. */
  required: LegalDocument[]
}

export type LegalAcceptanceSource =
  | 'mobile_signup'
  | 'web_register'
  | 'web_invite'
  | 'reaccept'

export function parseLegalVersion(value: string): { major: number; minor: number } | null {
  if (!LEGAL_VERSION_PATTERN.test(value)) return null
  const [major, minor] = value.split('.').map(Number)
  return { major: major!, minor: minor! }
}

/** Compares MAJOR.MINOR numerically; unparseable input sorts lowest. */
export function compareLegalVersions(a: string, b: string): number {
  const left = parseLegalVersion(a)
  const right = parseLegalVersion(b)
  if (!left || !right) return left ? 1 : right ? -1 : 0
  return left.major - right.major || left.minor - right.minor
}

/** True when the accepted version is on the same or a later major than the current one. */
export function isLegalAcceptanceCurrent(accepted: string | undefined, current: string): boolean {
  if (accepted === undefined) return false
  const have = parseLegalVersion(accepted)
  const need = parseLegalVersion(current)
  return have !== null && need !== null && have.major >= need.major
}
