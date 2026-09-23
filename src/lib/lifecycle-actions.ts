'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ApiError, AuthRequiredError } from './api'
import {
  archiveResource,
  approveRequest,
  getImpactPreview,
  purgeResource,
  rejectRequest,
  restoreResource,
  tombstoneResource,
} from './lifecycle-api'
import type {
  LifecycleDestructiveAction,
  LifecycleImpactPreview,
  LifecycleResourceType,
} from './lifecycle-api'

const TRASH_PATH = '/admin/trash'
const APPROVALS_PATH = '/admin/approvals'

const requiredReasonSchema = z.string().trim().min(1)
const optionalReasonSchema = z.string().trim().optional()

export type LifecycleErrorKey =
  | 'errors.forbidden'
  | 'errors.notFound'
  | 'errors.conflict'
  | 'errors.expired'
  | 'errors.invalidReason'
  | 'errors.genericError'

type LifecycleFailure = { ok: false; errorKey: LifecycleErrorKey; detail?: string }

export type LifecycleActionResult = { ok: true } | LifecycleFailure

export type LifecycleImpactPreviewResult =
  { ok: true; data: LifecycleImpactPreview } | { ok: false; errorKey: LifecycleErrorKey }

function mapApiError(err: unknown): LifecycleFailure {
  if (err instanceof AuthRequiredError) {
    redirect('/login')
  }
  if (err instanceof ApiError) {
    if (err.status === 403) return { ok: false, errorKey: 'errors.forbidden' }
    if (err.status === 404) return { ok: false, errorKey: 'errors.notFound' }
    if (err.status === 410) {
      return { ok: false, errorKey: 'errors.expired', detail: err.message || undefined }
    }
    if (err.status === 409) {
      return { ok: false, errorKey: 'errors.conflict', detail: err.message || undefined }
    }
    if (err.status === 400) {
      return { ok: false, errorKey: 'errors.genericError', detail: err.message || undefined }
    }
  }
  return { ok: false, errorKey: 'errors.genericError' }
}

export async function getImpactPreviewAction(
  resourceType: LifecycleResourceType,
  id: string,
  action: LifecycleDestructiveAction,
): Promise<LifecycleImpactPreviewResult> {
  try {
    const data = await getImpactPreview(resourceType, id, action)
    return { ok: true, data }
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403)
      return { ok: false, errorKey: 'errors.forbidden' }
    if (err instanceof ApiError && err.status === 404)
      return { ok: false, errorKey: 'errors.notFound' }
    return { ok: false, errorKey: 'errors.genericError' }
  }
}

export async function archiveResourceAction(
  resourceType: LifecycleResourceType,
  id: string,
  reason: string,
): Promise<LifecycleActionResult> {
  const parsed = requiredReasonSchema.safeParse(reason)
  if (!parsed.success) return { ok: false, errorKey: 'errors.invalidReason' }

  try {
    await archiveResource(resourceType, id, parsed.data)
  } catch (err) {
    return mapApiError(err)
  }
  revalidatePath(TRASH_PATH)
  return { ok: true }
}

export async function restoreResourceAction(
  resourceType: LifecycleResourceType,
  id: string,
  reason?: string,
): Promise<LifecycleActionResult> {
  const parsed = optionalReasonSchema.safeParse(reason)
  if (!parsed.success) return { ok: false, errorKey: 'errors.invalidReason' }

  try {
    await restoreResource(resourceType, id, parsed.data)
  } catch (err) {
    return mapApiError(err)
  }
  revalidatePath(TRASH_PATH)
  return { ok: true }
}

export async function tombstoneResourceAction(
  resourceType: LifecycleResourceType,
  id: string,
  reason: string,
): Promise<LifecycleActionResult> {
  const parsed = requiredReasonSchema.safeParse(reason)
  if (!parsed.success) return { ok: false, errorKey: 'errors.invalidReason' }

  try {
    await tombstoneResource(resourceType, id, parsed.data)
  } catch (err) {
    return mapApiError(err)
  }
  revalidatePath(TRASH_PATH)
  return { ok: true }
}

// Success here always means "filed for a second approver", never "purged" — the API
// answers every purge request with 202 and an approval record, synchronous completion is
// not a possible outcome of this endpoint.
export async function purgeResourceAction(
  resourceType: LifecycleResourceType,
  id: string,
  reason: string,
): Promise<LifecycleActionResult> {
  const parsed = requiredReasonSchema.safeParse(reason)
  if (!parsed.success) return { ok: false, errorKey: 'errors.invalidReason' }

  try {
    await purgeResource(resourceType, id, parsed.data)
  } catch (err) {
    return mapApiError(err)
  }
  revalidatePath(TRASH_PATH)
  revalidatePath(APPROVALS_PATH)
  return { ok: true }
}

export async function approveRequestAction(id: string): Promise<LifecycleActionResult> {
  try {
    await approveRequest(id)
  } catch (err) {
    return mapApiError(err)
  }
  revalidatePath(APPROVALS_PATH)
  revalidatePath(TRASH_PATH)
  return { ok: true }
}

export async function rejectRequestAction(
  id: string,
  reason: string,
): Promise<LifecycleActionResult> {
  const parsed = requiredReasonSchema.safeParse(reason)
  if (!parsed.success) return { ok: false, errorKey: 'errors.invalidReason' }

  try {
    await rejectRequest(id, parsed.data)
  } catch (err) {
    return mapApiError(err)
  }
  revalidatePath(APPROVALS_PATH)
  return { ok: true }
}
