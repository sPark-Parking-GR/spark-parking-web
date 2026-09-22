import { apiFetch } from './api'
import type {
  IdentityApprovalListResponse,
  IdentityLifecycleStatus,
  IdentityRole,
  IdentityUserDetail,
  IdentityUserListResponse,
} from './identity-types'

// Re-exported so server callers keep one import site for shapes and fetchers alike.
export * from './identity-types'

export function listUsers(params: {
  q?: string
  role?: IdentityRole
  lifecycleStatus?: IdentityLifecycleStatus
  operatorId?: string
  skip?: number
  take?: number
}): Promise<IdentityUserListResponse> {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.role) query.set('role', params.role)
  if (params.lifecycleStatus) query.set('lifecycleStatus', params.lifecycleStatus)
  if (params.operatorId) query.set('operatorId', params.operatorId)
  if (params.skip !== undefined) query.set('skip', String(params.skip))
  if (params.take !== undefined) query.set('take', String(params.take))
  const qs = query.toString()
  return apiFetch<IdentityUserListResponse>(`/admin/users${qs ? `?${qs}` : ''}`)
}

export function getUserDetail(id: string): Promise<IdentityUserDetail> {
  return apiFetch<IdentityUserDetail>(`/admin/users/${id}`)
}

export function listUserApprovals(): Promise<IdentityApprovalListResponse> {
  return apiFetch<IdentityApprovalListResponse>('/admin/users/approvals')
}
