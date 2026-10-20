import { z } from 'zod'

// Mirrors the API's emailSchema so a malformed address is refused here, with the caller's own
// message, before it is ever forwarded.
const LOCAL_PART = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}$/
const DOMAIN_LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/

function isDeliverableShape(email: string): boolean {
  const at = email.lastIndexOf('@')
  if (at < 1) return false
  const local = email.slice(0, at)
  const labels = email.slice(at + 1).split('.')
  if (!LOCAL_PART.test(local) || local.startsWith('.') || local.endsWith('.')) return false
  if (local.includes('..')) return false
  return labels.length >= 2 && labels.every((label) => DOMAIN_LABEL.test(label))
}

export function emailField(message?: string) {
  return z
    .string()
    .trim()
    .toLowerCase()
    .max(254, message)
    .email(message)
    .refine(isDeliverableShape, message)
    .refine((email) => !email.endsWith('.invalid'), message)
}
