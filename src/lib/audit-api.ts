import { apiFetch } from './api'

export interface AuditLogItem {
  id: string
  actorId: string | null
  actorName: string | null
  actorRole: string | null
  action: string
  entityType: string
  entityId: string
  entityLabel: string | null
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
  action?: string
  actorQuery?: string
}): Promise<AuditLogListResponse> {
  const query = new URLSearchParams()
  if (params.skip !== undefined) query.set('skip', String(params.skip))
  if (params.take !== undefined) query.set('take', String(params.take))
  if (params.action) query.set('action', params.action)
  if (params.actorQuery) query.set('actorQuery', params.actorQuery)
  const qs = query.toString()
  return apiFetch<AuditLogListResponse>(`/admin/audit-log${qs ? `?${qs}` : ''}`)
}
