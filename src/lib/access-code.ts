const ACCESS_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ACCESS_CODE_PATTERN = new RegExp(`^[${ACCESS_CODE_ALPHABET}]+$`)

export function normalizeAccessCode(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase()
}

export function isValidAccessCode(code: string): boolean {
  return code.length > 0 && ACCESS_CODE_PATTERN.test(code)
}

const ACCESS_CODE_MASK_PREFIX = '••••'
const ACCESS_CODE_VISIBLE_SUFFIX_LENGTH = 4

// List views identify a row by these trailing characters; the full code is only ever
// shown on the booking detail page, which is the deliberate place to reveal it.
export function maskAccessCode(code: string): string {
  if (code.length <= ACCESS_CODE_VISIBLE_SUFFIX_LENGTH) return ACCESS_CODE_MASK_PREFIX
  return `${ACCESS_CODE_MASK_PREFIX}${code.slice(-ACCESS_CODE_VISIBLE_SUFFIX_LENGTH)}`
}
