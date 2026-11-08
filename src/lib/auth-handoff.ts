import { emailField } from './email-schema'

const KEY = 'spark-auth-email'

// Carries an address between auth pages (login, forgot password, reset, register) in this tab
// only. It goes through sessionStorage rather than the URL: an address in a query string ends
// up in server logs, history and referrers.
export function stashAuthEmail(email: string): void {
  try {
    window.sessionStorage.setItem(KEY, email.trim().toLowerCase())
  } catch {
    // the next page simply opens empty
  }
}

export function peekAuthEmail(): string | null {
  try {
    const stored = window.sessionStorage.getItem(KEY)
    if (stored === null) return null
    const parsed = emailField().safeParse(stored)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function takeAuthEmail(): string | null {
  const email = peekAuthEmail()
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
  return email
}
