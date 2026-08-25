'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { apiFetch, ApiError, AuthRequiredError } from './api'
import type { LifecycleItemStatus } from './lifecycle-constants'

const ONBOARDING_PATH = '/admin/onboarding'

export type OperatorStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED'
export type OperatorLifecycleStatus = 'ACTIVE' | LifecycleItemStatus

export interface OperatorSummary {
  id: string
  name: string
  status: OperatorStatus
  lifecycleStatus: OperatorLifecycleStatus
  facilityCount: number
  memberCount: number
  createdAt: string
}

export type OperatorErrorKey =
  | 'errors.invalidOperator'
  | 'errors.suspendForbidden'
  | 'errors.reactivateForbidden'
  | 'errors.operatorNotFound'
  | 'errors.genericError'

export type OperatorActionResult =
  | { ok: true }
  | { ok: false; errorKey: OperatorErrorKey; detail?: string }

export interface OperatorFacilitySummary {
  id: string
  name: string
  address: string
  isActive: boolean
  isPublished: boolean
  kind: string
}

export interface OperatorPlanSummary {
  id: string
  name: string
  isActive: boolean
  isDefault: boolean
}

export interface OperatorMemberSummary {
  userId: string
  email: string
  role: string
  createdAt: string
}

export interface OperatorDetail extends OperatorSummary {
  facilities: OperatorFacilitySummary[]
  plans: OperatorPlanSummary[]
  members: OperatorMemberSummary[]
}

export async function listOperatorsAction(): Promise<OperatorSummary[]> {
  try {
    return await apiFetch<OperatorSummary[]>('/admin/operators')
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    return []
  }
}

async function transitionOperator(
  id: string,
  path: 'suspend' | 'reactivate',
  errors: { forbiddenKey: OperatorErrorKey },
): Promise<OperatorActionResult> {
  if (!id) return { ok: false, errorKey: 'errors.invalidOperator' }

  try {
    await apiFetch(`/admin/operators/${id}/${path}`, { method: 'POST' })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      if (err.status === 403) return { ok: false, errorKey: errors.forbiddenKey }
      if (err.status === 404) return { ok: false, errorKey: 'errors.operatorNotFound' }
      if (err.status === 409)
        return { ok: false, errorKey: 'errors.genericError', detail: err.message }
    }
    return { ok: false, errorKey: 'errors.genericError' }
  }

  revalidatePath(ONBOARDING_PATH)
  return { ok: true }
}

export async function suspendOperatorAction(
  _prev: OperatorActionResult,
  formData: FormData,
): Promise<OperatorActionResult> {
  const id = String(formData.get('id'))
  return transitionOperator(id, 'suspend', {
    forbiddenKey: 'errors.suspendForbidden',
  })
}

export async function reactivateOperatorAction(
  _prev: OperatorActionResult,
  formData: FormData,
): Promise<OperatorActionResult> {
  const id = String(formData.get('id'))
  return transitionOperator(id, 'reactivate', {
    forbiddenKey: 'errors.reactivateForbidden',
  })
}
