/**
 * Pure shapes and closed value sets for the admin-invite surface, kept apart from
 * `admin-invite-api.ts` because CLIENT components need the constants.
 *
 * `admin-invite-api.ts` imports `apiFetch`, which reaches `session.ts` and therefore
 * `next/headers` — server-only. A 'use client' component importing a runtime value from
 * there drags that whole chain into the browser bundle and fails the production build,
 * which typecheck alone does not catch. Nothing in this file may import anything but types.
 */
export const ADMIN_INVITE_STATUSES = ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] as const
export type AdminInviteStatus = (typeof ADMIN_INVITE_STATUSES)[number]

export interface AdminInviteSummary {
  id: string
  email: string
  displayName: string | null
  status: AdminInviteStatus
  invitedById: string
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}

export interface AdminInviteIssued extends AdminInviteSummary {
  delivered: boolean
}

export interface AdminInviteTokenValidation {
  email: string
  expired: boolean
  // True when the invited address already has a mobile-only account: accepting attaches
  // this invite's role to that account instead of creating a new one, so the accept form
  // must collect the EXISTING password rather than let the person choose a new one.
  requiresExistingPassword: boolean
}
