import { apiFetch } from './api'

export interface AuditLogItem {
  id: string
  actorId: string | null
  actorName: string | null
  actorRole: string | null
  action: string
  entityType: string
  entityId: string
  createdAt: string
}

export interface AuditLogListResponse {
  items: AuditLogItem[]
  total: number
  skip: number
  take: number
}

export function listAuditLog(params: {
  skip?: number
  take?: number
}): Promise<AuditLogListResponse> {
  const query = new URLSearchParams()
  if (params.skip !== undefined) query.set('skip', String(params.skip))
  if (params.take !== undefined) query.set('take', String(params.take))
  const qs = query.toString()
  return apiFetch<AuditLogListResponse>(`/admin/audit-log${qs ? `?${qs}` : ''}`)
}
