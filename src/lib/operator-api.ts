import { apiFetch } from './api'
import type { OperatorDetail, OperatorSummary } from './operator-actions'

export function getOperators(): Promise<OperatorSummary[]> {
  return apiFetch<OperatorSummary[]>('/operators')
}

export function getOperatorDetail(id: string): Promise<OperatorDetail> {
  return apiFetch<OperatorDetail>(`/operators/${id}`)
}
