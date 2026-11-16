import { z } from 'zod'

const STORAGE_KEY = 'spark-recent-logins'
export const MAX_RECENT_LOGINS = 3

const recentLoginsSchema = z.array(z.object({ email: z.string().email().max(254) }))

export type RecentLogin = z.infer<typeof recentLoginsSchema>[number]

// Only the address is kept, never a token or password, and only for people who ticked "keep me
// signed in" on this device. Storage can be blocked, so every access degrades to "no recents".
export function readRecentLogins(): RecentLogin[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return []
    const parsed = recentLoginsSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data.slice(0, MAX_RECENT_LOGINS) : []
  } catch {
    return []
  }
}

function write(entries: RecentLogin[]): RecentLogin[] {
  try {
    if (entries.length === 0) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // nothing to remember it with
  }
  return entries
}

export function rememberRecentLogin(email: string): RecentLogin[] {
  const normalised = email.trim().toLowerCase()
  const others = readRecentLogins().filter((entry) => entry.email.toLowerCase() !== normalised)
  return write([{ email: normalised }, ...others].slice(0, MAX_RECENT_LOGINS))
}

export function forgetRecentLogin(email: string): RecentLogin[] {
  const normalised = email.trim().toLowerCase()
  return write(readRecentLogins().filter((entry) => entry.email.toLowerCase() !== normalised))
}
