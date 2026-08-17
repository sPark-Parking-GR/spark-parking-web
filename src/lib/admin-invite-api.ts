import { apiFetch } from './api'
import type { AdminInviteSummary } from './admin-invite-types'

// Re-exported so server callers keep one import site for shapes and fetchers alike.
export * from './admin-invite-types'

export function listAdminInvites(): Promise<AdminInviteSummary[]> {
  return apiFetch<AdminInviteSummary[]>('/admin-invites')
}
