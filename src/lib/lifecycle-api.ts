import { apiFetch } from './api'
import type {
  LifecycleResourceType,
  LifecycleStatus,
  LifecycleItemStatus,
  LifecycleDestructiveAction,
} from './lifecycle-constants'

export {
  LIFECYCLE_RESOURCE_TYPES,
  LIFECYCLE_STATUSES,
  LIFECYCLE_DESTRUCTIVE_ACTIONS,
} from './lifecycle-constants'
export type {
  LifecycleResourceType,
  LifecycleStatus,
  LifecycleItemStatus,
  LifecycleDestructiveAction,
} from './lifecycle-constants'

export interface LifecycleTrashItem {
  id: string
  resourceType: LifecycleResourceType
  name: string
  status: LifecycleItemStatus
  reason: string | null
  changedAt: string | null
  changedBy: string | null
  purgeAfter: string | null
}

export interface LifecycleTrashListResponse {
  items: LifecycleTrashItem[]
  total: number
  skip: number
  take: number
}

export interface LifecycleImpactBlocker {
  code: string
  message: string
  remedy: string
}

export interface LifecycleImpactWarning {
  code: string
  message: string
  count: number
}

export interface LifecycleImpactEffect {
  entity: string
  action: string
  count: number
}

export interface LifecycleImpactPreview {
  blockers: LifecycleImpactBlocker[]
  warnings: LifecycleImpactWarning[]
  effects: LifecycleImpactEffect[]
  requiresForce: boolean
}

export interface LifecycleApprovalRequest {
  id: string
  action: string
  resourceType: LifecycleResourceType
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

export interface LifecycleApprovalListResponse {
  items: LifecycleApprovalRequest[]
  total: number
}

export function listTrash(params: {
  resourceType?: LifecycleResourceType
  status?: LifecycleStatus
  skip?: number
  take?: number
}): Promise<LifecycleTrashListResponse> {
  const query = new URLSearchParams()
  if (params.resourceType) query.set('resourceType', params.resourceType)
  if (params.status) query.set('status', params.status)
  if (params.skip !== undefined) query.set('skip', String(params.skip))
  if (params.take !== undefined) query.set('take', String(params.take))
  const qs = query.toString()
  return apiFetch<LifecycleTrashListResponse>(`/admin/lifecycle/trash${qs ? `?${qs}` : ''}`)
}

export function getImpactPreview(
  resourceType: LifecycleResourceType,
  id: string,
  action: LifecycleDestructiveAction,
): Promise<LifecycleImpactPreview> {
  return apiFetch<LifecycleImpactPreview>(
    `/admin/lifecycle/${resourceType}/${id}/impact?action=${action}`,
  )
}

export function archiveResource(
  resourceType: LifecycleResourceType,
  id: string,
  reason: string,
): Promise<void> {
  return apiFetch<void>(`/admin/lifecycle/${resourceType}/${id}/archive`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function restoreResource(
  resourceType: LifecycleResourceType,
  id: string,
  reason?: string,
): Promise<void> {
  return apiFetch<void>(`/admin/lifecycle/${resourceType}/${id}/restore`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  })
}

export function tombstoneResource(
  resourceType: LifecycleResourceType,
  id: string,
  reason: string,
): Promise<void> {
  return apiFetch<void>(`/admin/lifecycle/${resourceType}/${id}/tombstone`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

// Always 202: purge never destroys inline, it only files a two-person-rule request. A
// successful call therefore always means "pending approval" — never "completed".
export function purgeResource(
  resourceType: LifecycleResourceType,
  id: string,
  reason: string,
): Promise<LifecycleApprovalRequest> {
  return apiFetch<LifecycleApprovalRequest>(`/admin/lifecycle/${resourceType}/${id}/purge`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function listApprovals(): Promise<LifecycleApprovalListResponse> {
  return apiFetch<LifecycleApprovalListResponse>('/admin/lifecycle/approvals')
}

export function approveRequest(id: string): Promise<void> {
  return apiFetch<void>(`/admin/lifecycle/approvals/${id}/approve`, { method: 'POST' })
}

export function rejectRequest(id: string, reason: string): Promise<void> {
  return apiFetch<void>(`/admin/lifecycle/approvals/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}
