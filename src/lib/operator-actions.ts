'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { apiFetch, ApiError, AuthRequiredError } from './api'

const ONBOARDING_PATH = '/dashboard/onboarding'

export type OperatorStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED'

export interface OperatorSummary {
  id: string
  name: string
  status: OperatorStatus
  facilityCount: number
  memberCount: number
  createdAt: string
}

export type OperatorActionResult = { ok: true } | { ok: false; error: string }

export async function listOperatorsAction(): Promise<OperatorSummary[]> {
  try {
    return await apiFetch<OperatorSummary[]>('/operators')
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    return []
  }
}

async function transitionOperator(
  id: string,
  path: 'suspend' | 'reactivate',
  errors: { forbidden: string },
): Promise<OperatorActionResult> {
  if (!id) return { ok: false, error: 'Invalid operator.' }

  try {
    await apiFetch(`/operators/${id}/${path}`, { method: 'POST' })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError) {
      if (err.status === 403) return { ok: false, error: errors.forbidden }
      if (err.status === 404) return { ok: false, error: 'Operator not found.' }
      if (err.status === 409) return { ok: false, error: err.message }
    }
    return { ok: false, error: 'Something went wrong. Please try again.' }
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
    forbidden: 'You are not allowed to suspend operators.',
  })
}

export async function reactivateOperatorAction(
  _prev: OperatorActionResult,
  formData: FormData,
): Promise<OperatorActionResult> {
  const id = String(formData.get('id'))
  return transitionOperator(id, 'reactivate', {
    forbidden: 'You are not allowed to reactivate operators.',
  })
}
