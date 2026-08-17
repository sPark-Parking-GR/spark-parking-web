/**
 * Pure shapes and closed value sets for the identity surface, kept apart from
 * `identity-api.ts` because CLIENT components need the constants.
 *
 * `identity-api.ts` imports `apiFetch`, which reaches `session.ts` and therefore
 * `next/headers` — server-only. A 'use client' component importing a runtime value from
 * there drags that whole chain into the browser bundle and fails the production build,
 * which typecheck alone does not catch. Nothing in this file may import anything but types.
 */
export const IDENTITY_ROLES = [
  'USER',
  'OPERATOR_STAFF',
  'OPERATOR_ADMIN',
  'PLATFORM_ADMIN',
  'SUPER_ADMIN',
] as const
export type IdentityRole = (typeof IDENTITY_ROLES)[number]

// Only the roles that are not derived from operator membership — what the role-change form
// may actually set. Mirrors ASSIGNABLE_ROLES in the API's identity.dto.ts.
export const ASSIGNABLE_IDENTITY_ROLES = ['USER', 'PLATFORM_ADMIN', 'SUPER_ADMIN'] as const
export type AssignableIdentityRole = (typeof ASSIGNABLE_IDENTITY_ROLES)[number]

export const IDENTITY_LIFECYCLE_STATUSES = ['ACTIVE', 'ARCHIVED', 'TOMBSTONED', 'PURGED'] as const
export type IdentityLifecycleStatus = (typeof IDENTITY_LIFECYCLE_STATUSES)[number]

export type OperatorMemberRole = 'ADMIN' | 'STAFF'

export interface IdentityMembership {
  operatorId: string
  operatorName: string
  role: OperatorMemberRole
}

export interface IdentityUserSummary {
  id: string
  email: string
  displayName: string | null
  role: IdentityRole
  emailVerified: boolean
  lifecycleStatus: IdentityLifecycleStatus
  anonymisedAt: string | null
  createdAt: string
  memberships: IdentityMembership[]
}

export interface IdentityUserListResponse {
  items: IdentityUserSummary[]
  total: number
  skip: number
  take: number
}

export interface IdentityAuditEntry {
  id: string
  action: string
  actorId: string | null
  actorRole: string | null
  createdAt: string
}

export interface IdentityUserDetail extends IdentityUserSummary {
  updatedAt: string
  sessionsValidFrom: string | null
  lifecycleChangedAt: string | null
  lifecycleChangedBy: string | null
  lifecycleReason: string | null
  purgeAfter: string | null
  recentActivity: IdentityAuditEntry[]
}

export interface IdentityApproval {
  id: string
  action: string
  resourceId: string
  reason: string
  requestedBy: string
  requestedByRole: string
  status: string
  expiresAt: string
  decidedBy: string | null
  decidedAt: string | null
  decisionReason: string | null
  createdAt: string
}

export interface IdentityApprovalListResponse {
  items: IdentityApproval[]
  total: number
}
