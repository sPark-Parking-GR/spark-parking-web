'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  createFacility,
  updateFacility,
  deleteFacility,
  bulkFacilities,
  adminMapFacilities,
  assignFacilityTariff,
  getFacilityTariffAssignments,
  ApiError,
  AuthRequiredError,
} from './api'
import { buildFacilityFormSchema, facilityFormSchema } from './facility-schema'
import type {
  AdminMapResponse,
  AssignTariffInput,
  BulkFacilityAction,
  CreateFacilityInput,
  FacilityKind,
  FacilityTariffAssignmentsResponse,
  FacilityVehicleType,
  UpdateFacilityInput,
} from './api'
import type { OpeningHours } from '@spark/types'

const FACILITIES_PATH = '/dashboard/facilities'

export type FacilityErrorKey =
  | 'errors.forbidden'
  | 'errors.notFound'
  | 'errors.invalidData'
  | 'errors.genericError'
  | 'errors.invalidInput'
  | 'errors.selectAtLeastOne'
  | 'errors.tariffPlanNotFound'
  | 'errors.facilityOrTariffNotFound'
  | 'errors.mapLoadFailed'

export type FacilityActionResult =
  | { ok: true }
  | { ok: false; errorKey: FacilityErrorKey | string; detail?: string }

function mapApiError(err: unknown): FacilityActionResult {
  if (err instanceof AuthRequiredError) {
    redirect('/login')
  }
  if (err instanceof ApiError) {
    if (err.status === 403) return { ok: false, errorKey: 'errors.forbidden' }
    if (err.status === 404) return { ok: false, errorKey: 'errors.notFound' }
    if (err.status === 400) {
      const detail = err.errors
        ?.map((issue) => (issue.path ? `${issue.path}: ${issue.message}` : issue.message))
        .join('; ')
      return {
        ok: false,
        errorKey: 'errors.invalidData',
        detail: detail || err.message || undefined,
      }
    }
  }
  return { ok: false, errorKey: 'errors.genericError' }
}

function buildOpeningHours(
  is24h: boolean | undefined,
  openTime: string | undefined,
  closeTime: string | undefined,
): OpeningHours {
  if (is24h) {
    return { is24h: true }
  }
  const open = openTime ?? '08:00'
  const close = closeTime ?? '20:00'
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const schedule: Record<string, { open: string; close: string }> = {}
  for (const day of days) {
    schedule[day] = { open, close }
  }
  return { is24h: false, schedule }
}

function parseVehicleTypes(formData: FormData): string[] {
  return formData.getAll('vehicleTypes').map((v) => String(v))
}

export async function createFacilityAction(
  _prev: FacilityActionResult,
  formData: FormData,
): Promise<FacilityActionResult> {
  const raw = {
    name: formData.get('name'),
    address: formData.get('address'),
    lat: formData.get('lat'),
    lng: formData.get('lng'),
    totalCapacity: formData.get('totalCapacity'),
    onlineQuota: formData.get('onlineQuota'),
    vehicleTypes: parseVehicleTypes(formData),
    heightRestrictionCm: formData.get('heightRestrictionCm') || null,
    amenities: formData.get('amenities'),
    cancellationPolicy: formData.get('cancellationPolicy'),
    is24h: formData.get('is24h') === 'true',
    openTime: formData.get('openTime'),
    closeTime: formData.get('closeTime'),
    operatorId: formData.get('operatorId'),
  }

  const parsed = facilityFormSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, errorKey: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }
  }

  const {
    name,
    address,
    lat,
    lng,
    totalCapacity,
    onlineQuota,
    vehicleTypes,
    heightRestrictionCm,
    amenities,
    cancellationPolicy,
    is24h,
    openTime,
    closeTime,
    operatorId,
  } = parsed.data

  const input: CreateFacilityInput = {
    name,
    address,
    lat,
    lng,
    totalCapacity,
    onlineQuota,
    vehicleTypes,
    heightRestrictionCm: heightRestrictionCm ?? null,
    openingHours: buildOpeningHours(is24h, openTime ?? undefined, closeTime ?? undefined),
    amenities: amenities
      ? amenities
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    cancellationPolicy: cancellationPolicy ?? '',
    ...(operatorId ? { operatorId } : {}),
  }

  try {
    await createFacility(input)
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(FACILITIES_PATH)
  redirect(FACILITIES_PATH)
}

export async function updateFacilityAction(
  id: string,
  _prev: FacilityActionResult,
  formData: FormData,
): Promise<FacilityActionResult> {
  const raw = {
    name: formData.get('name'),
    address: formData.get('address'),
    lat: formData.get('lat'),
    lng: formData.get('lng'),
    totalCapacity: formData.get('totalCapacity'),
    onlineQuota: formData.get('onlineQuota'),
    vehicleTypes: parseVehicleTypes(formData),
    heightRestrictionCm: formData.get('heightRestrictionCm') || null,
    amenities: formData.get('amenities'),
    cancellationPolicy: formData.get('cancellationPolicy'),
    is24h: formData.get('is24h') === 'true',
    openTime: formData.get('openTime'),
    closeTime: formData.get('closeTime'),
    isActive: formData.get('isActive'),
  }

  // Non-business facilities are catalog-only: the form omits the booking sections, so their
  // fields must stay absent from the payload rather than be sent as fabricated defaults.
  const kind = formData.get('kind')
  const isBusiness = kind === 'BUSINESS' || kind === null

  const parsed = buildFacilityFormSchema(isBusiness).safeParse(raw)
  if (!parsed.success) {
    return { ok: false, errorKey: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }
  }

  const {
    name,
    address,
    lat,
    lng,
    totalCapacity,
    onlineQuota,
    vehicleTypes,
    heightRestrictionCm,
    amenities,
    cancellationPolicy,
    is24h,
    openTime,
    closeTime,
    isActive,
  } = parsed.data

  const input: UpdateFacilityInput = {
    name,
    address,
    lat,
    lng,
    isActive: isActive ?? false,
    ...(totalCapacity !== undefined ? { totalCapacity } : {}),
    ...(onlineQuota !== undefined ? { onlineQuota } : {}),
    ...(vehicleTypes && vehicleTypes.length > 0 ? { vehicleTypes } : {}),
    ...(isBusiness && heightRestrictionCm !== undefined ? { heightRestrictionCm } : {}),
    ...(amenities !== undefined
      ? {
          amenities: amenities
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }
      : {}),
    ...(cancellationPolicy !== undefined ? { cancellationPolicy } : {}),
    ...(isBusiness
      ? { openingHours: buildOpeningHours(is24h, openTime ?? undefined, closeTime ?? undefined) }
      : {}),
  }

  try {
    await updateFacility(id, input)
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(FACILITIES_PATH)
  revalidatePath(`${FACILITIES_PATH}/${id}`)
  return { ok: true }
}

export async function bulkFacilityAction(
  action: BulkFacilityAction,
  ids: string[],
  assignments?: AssignTariffInput[],
): Promise<FacilityActionResult & { affected?: number }> {
  if (ids.length === 0) return { ok: false, errorKey: 'errors.selectAtLeastOne' }

  try {
    const { affected } = await bulkFacilities(ids, action, assignments)
    revalidatePath(FACILITIES_PATH)
    return { ok: true, affected }
  } catch (err) {
    if (action === 'assignTariff' && err instanceof ApiError && err.status === 404) {
      return { ok: false, errorKey: 'errors.tariffPlanNotFound' }
    }
    return mapApiError(err)
  }
}

export async function getFacilityTariffAssignmentsAction(
  facilityId: string,
): Promise<FacilityTariffAssignmentsResponse | null> {
  try {
    return await getFacilityTariffAssignments(facilityId)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    return null
  }
}

export async function assignTariffAction(
  facilityId: string,
  vehicleType: FacilityVehicleType,
  tariffPlanId: string | null,
): Promise<FacilityActionResult> {
  try {
    await assignFacilityTariff(facilityId, vehicleType, tariffPlanId)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return { ok: false, errorKey: 'errors.facilityOrTariffNotFound' }
    }
    return mapApiError(err)
  }

  revalidatePath(FACILITIES_PATH)
  revalidatePath(`${FACILITIES_PATH}/${facilityId}`)
  return { ok: true }
}

export type MapFacilitiesResult =
  | { ok: true; data: AdminMapResponse }
  | { ok: false; errorKey: 'errors.mapLoadFailed' }

export async function fetchMapFacilitiesAction(params: {
  north: number
  south: number
  east: number
  west: number
  q?: string
  isActive?: boolean
  isVerified?: boolean
  kind?: FacilityKind
}): Promise<MapFacilitiesResult> {
  try {
    const data = await adminMapFacilities(params)
    return { ok: true, data }
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    return { ok: false, errorKey: 'errors.mapLoadFailed' }
  }
}

export async function deleteFacilityAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id'))
  if (!id) return

  try {
    await deleteFacility(id)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    return
  }

  revalidatePath(FACILITIES_PATH)
  redirect(FACILITIES_PATH)
}
