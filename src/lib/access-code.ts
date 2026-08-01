const ACCESS_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ACCESS_CODE_PATTERN = new RegExp(`^[${ACCESS_CODE_ALPHABET}]+$`)

export function normalizeAccessCode(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase()
}

export function isValidAccessCode(code: string): boolean {
  return code.length > 0 && ACCESS_CODE_PATTERN.test(code)
}
