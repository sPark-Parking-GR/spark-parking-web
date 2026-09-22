import { apiFetch } from './api'
import type { OperatorDetail, OperatorSummary } from './operator-actions'

export function getOperators(): Promise<OperatorSummary[]> {
  return apiFetch<OperatorSummary[]>('/admin/operators')
}

export function getOperatorDetail(id: string): Promise<OperatorDetail> {
  return apiFetch<OperatorDetail>(`/admin/operators/${id}`)
}
