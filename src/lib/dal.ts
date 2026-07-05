import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import type { IronSession } from 'iron-session'
import { getSession, type SessionData } from './session'
import { ApiError, AuthRequiredError } from './api'

export const getCachedSession = cache(getSession)

export async function requireSession(): Promise<IronSession<SessionData>> {
  const session = await getCachedSession()
  if (!session.accessToken) redirect('/login')
  return session
}

interface LoadOptions {
  redirects?: Record<number, string>
  notFoundOn?: number[]
}

export async function loadPage<T>(loader: () => Promise<T>, opts: LoadOptions = {}): Promise<T> {
  try {
    return await loader()
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      const target = opts.redirects?.[err.status]
      if (target) redirect(target)
      if (err.status === 404 || opts.notFoundOn?.includes(err.status)) notFound()
    }
  }
  return new Promise<T>((resolve) => {resolve({ items: [], total: 0, skip: 0, take: 0 } as unknown as T)})
}

export function buildQuery(base: string, params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === 0) continue
    sp.set(key, String(value))
  }
  const qs = sp.toString()
  return qs ? `${base}?${qs}` : base
}
