import { apiFetch, listFacilities } from './api'
import type { TeamMemberInvite, TeamMemberSummary } from './team-types'

export function getOperatorMembers(operatorId: string): Promise<TeamMemberSummary[]> {
  return apiFetch<TeamMemberSummary[]>(`/operators/${operatorId}/members`)
}

export function listMemberInvites(): Promise<TeamMemberInvite[]> {
  return apiFetch<TeamMemberInvite[]>('/invites')
}

/**
 * The session carries no operator id for an operator role, and `GET
 * /operators/:operatorId/members` requires one in the URL — there is no "my operator"
 * endpoint to ask instead. The one thing every operator_admin who can reach this page
 * already has is at least their own membership, but membership rows are only ever
 * returned scoped to an operator id that's already known, so that can't be the source
 * either.
 *
 * What IS reliably available without inventing a new endpoint: any existing resource
 * that already carries the caller's operator id. A facility does (`listFacilities`,
 * the same call the facilities pages already make), and so does a pending member
 * invite — the caller passes in whatever it already fetched for the invites list so
 * this never issues a second `/invites` request just to look at the same rows.
 */
export async function getMyOperatorId(knownInvites?: TeamMemberInvite[]): Promise<string | null> {
  const { items } = await listFacilities({ take: 1 })
  const fromFacility = items[0]?.operatorId
  if (fromFacility) return fromFacility

  const invites = knownInvites ?? (await listMemberInvites())
  return invites.find((invite) => invite.operatorId)?.operatorId ?? null
}
