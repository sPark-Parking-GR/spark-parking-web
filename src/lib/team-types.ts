/**
 * Pure shapes and closed value sets for the operator team surface, kept apart from
 * `team-api.ts` because CLIENT components need the constants.
 *
 * `team-api.ts` imports `apiFetch`, which reaches `session.ts` and therefore
 * `next/headers` — server-only. A 'use client' component importing a runtime value from
 * there drags that whole chain into the browser bundle and fails the production build,
 * which typecheck alone does not catch. Nothing in this file may import anything but types.
 */
import type { OrgPermission } from '@spark/types'

export const TEAM_MEMBER_ROLES = ['ADMIN', 'STAFF'] as const
export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number]

export interface TeamMemberSummary {
  userId: string
  email: string
  role: TeamMemberRole
  createdAt: string
  // Effective, not stored: an ADMIN's set is derived server-side, so this is what
  // they may actually do — never a partial or stale list.
  scopes: OrgPermission[]
}

export const TEAM_INVITE_STATUSES = ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] as const
export type TeamInviteStatus = (typeof TEAM_INVITE_STATUSES)[number]

export interface TeamMemberInvite {
  id: string
  email: string
  role: TeamMemberRole
  status: TeamInviteStatus
  // Carried only so the page can fall back to it when resolving the caller's own
  // operator id — see `getMyOperatorId` in team-api.ts.
  operatorId: string | null
  expiresAt: string
  createdAt: string
}

/**
 * `OrgPermission` values contain a literal dot (`org:facility.read`), which next-intl
 * would otherwise split on when resolving `team.scopesEditor.scopes.<key>.label` — so
 * each scope is addressed through this flat, dot-free key instead. Exhaustive by
 * construction: `Record<OrgPermission, string>` fails to compile if a scope is renamed
 * or a new one is added here without a matching messages entry.
 */
export const SCOPE_I18N_KEY: Record<OrgPermission, string> = {
  'org:facility.read': 'facilityRead',
  'org:facility.write': 'facilityWrite',
  'org:tariff.read': 'tariffRead',
  'org:tariff.write': 'tariffWrite',
  'org:booking.read': 'bookingRead',
  'org:booking.write': 'bookingWrite',
  'org:scan.execute': 'scanExecute',
  'org:stats.read': 'statsRead',
  'org:member.manage': 'memberManage',
  'org:billing.view': 'billingView',
}
