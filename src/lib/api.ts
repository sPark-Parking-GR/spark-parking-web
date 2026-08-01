import { getSession } from './session'
import type { SessionData } from './session'
import type { IronSession } from 'iron-session'
import type { AuthResult } from '@spark/types'
import type { OpeningHours } from '@spark/types'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://127.0.0.1:3001/api/v1'

const EXPIRY_SKEW_MS = 30_000

export interface ApiFieldError {
  path: string
  message: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors?: ApiFieldError[],
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class AuthRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'AuthRequiredError'
  }
}

export type FacilityKind = 'BUSINESS' | 'FREE_PUBLIC' | 'RESTRICTED' | 'UNKNOWN'
export type FacilitySource = 'OSM' | 'GOOGLE' | 'MANUAL' | null
export type BulkFacilityAction =
  | 'enable'
  | 'disable'
  | 'deploy'
  | 'publish'
  | 'unpublish'
  | 'delete'
  | 'assignTariff'

// Prisma VehicleType enum casing, used only by the facility tariff-assignment endpoints.
// Distinct from the lowercase @spark/types VehicleType used elsewhere (tariff plans, quotes).
export type FacilityVehicleType = 'CAR' | 'MOTORCYCLE' | 'VAN' | 'TRUCK'

export type FacilityTariffSource = 'explicit' | 'default' | 'none'

export interface FacilityTariffAssignment {
  vehicleType: FacilityVehicleType
  tariffPlanId: string | null
  tariffPlanName: string | null
  source: FacilityTariffSource
}

export interface FacilityTariffAssignmentsResponse {
  assignments: FacilityTariffAssignment[]
  defaultPlan: { id: string; name: string } | null
}

export interface AssignTariffInput {
  vehicleType: FacilityVehicleType
  tariffPlanId: string | null
}

export interface AdminFacilityListItem {
  id: string
  name: string
  address: string
  totalCapacity: number
  onlineQuota: number
  isActive: boolean
  isVerified: boolean
  kind: FacilityKind
  source: FacilitySource
  operatorId: string
  operatorName: string
  createdAt: string
  updatedAt: string
}

export interface FacilityTariffPlan {
  id: string
  name: string
  vehicleTypes: string[]
}

export interface AdminMapPoint {
  id: string
  name: string
  lat: number
  lng: number
  kind: FacilityKind
  isActive: boolean
  isVerified: boolean
}

export interface AdminMapCluster {
  id: string
  lat: number
  lng: number
  count: number
}

export interface AdminMapResponse {
  mode: 'points' | 'clusters'
  points: AdminMapPoint[]
  clusters: AdminMapCluster[]
  total: number
}

export interface AdminFacility {
  id: string
  operatorId: string
  kind: FacilityKind
  name: string
  address: string
  lat: number
  lng: number
  totalCapacity: number
  onlineQuota: number
  vehicleTypes: string[]
  heightRestrictionCm: number | null
  openingHours: OpeningHours
  amenities: string[]
  cancellationPolicy: string
  isActive: boolean
  isVerified: boolean
  rank: number
  createdAt: string
  updatedAt: string
}

export interface FacilityListResponse {
  items: AdminFacilityListItem[]
  total: number
  skip: number
  take: number
}

export interface CreateFacilityInput {
  name: string
  address: string
  lat: number
  lng: number
  totalCapacity: number
  onlineQuota: number
  vehicleTypes: string[]
  heightRestrictionCm?: number | null
  openingHours: OpeningHours
  amenities?: string[]
  cancellationPolicy?: string
  operatorId?: string
}

export interface UpdateFacilityInput {
  name?: string
  address?: string
  lat?: number
  lng?: number
  totalCapacity?: number
  onlineQuota?: number
  vehicleTypes?: string[]
  heightRestrictionCm?: number | null
  openingHours?: OpeningHours
  amenities?: string[]
  cancellationPolicy?: string
  isActive?: boolean
  kind?: FacilityKind
}

function toSessionData(result: AuthResult): SessionData {
  return {
    accessToken: result.session.accessToken,
    refreshToken: result.session.refreshToken,
    expiresAt: result.session.expiresAt,
    user: result.session.user,
  }
}

async function callRefresh(refreshToken: string): Promise<SessionData> {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new AuthRequiredError('Session refresh failed')
  }
  const result = (await response.json()) as AuthResult
  return toSessionData(result)
}

// WHY: iron-session can only persist a cookie when a writable cookie store is
// available (Server Actions / Route Handlers). During plain Server Component
// render the cookie is read-only and session.save() throws, so when persistence
// fails we fall back to an in-memory refresh for the lifetime of the request.
async function refreshSession(session: IronSession<SessionData>): Promise<SessionData> {
  const refreshed = await callRefresh(session.refreshToken)
  session.accessToken = refreshed.accessToken
  session.refreshToken = refreshed.refreshToken
  session.expiresAt = refreshed.expiresAt
  session.user = refreshed.user
  try {
    await session.save()
  } catch {
    // read-only render context: keep refreshed token in memory for this request only
  }
  return refreshed
}

function isExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - EXPIRY_SKEW_MS
}

async function authFetch(path: string, init: RequestInit, accessToken: string): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(`${BASE_URL}${path}`, { ...init, headers, cache: 'no-store' })
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await getSession()
  if (!session.accessToken) {
    throw new AuthRequiredError()
  }

  let accessToken = session.accessToken
  if (isExpired(session.expiresAt)) {
    try {
      accessToken = (await refreshSession(session)).accessToken
    } catch {
      try {
        session.destroy()
      } catch {
        // read-only context: cookie cannot be cleared here, middleware will catch it
      }
      throw new AuthRequiredError()
    }
  }

  let response: Response
  try {
    response = await authFetch(path, init, accessToken)
  } catch {
    throw new ApiError('Network error', 0)
  }

  if (response.status === 401) {
    try {
      accessToken = (await refreshSession(session)).accessToken
    } catch {
      try {
        session.destroy()
      } catch {
        // read-only context
      }
      throw new AuthRequiredError()
    }
    try {
      response = await authFetch(path, init, accessToken)
    } catch {
      throw new ApiError('Network error', 0)
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string
      errors?: ApiFieldError[]
    }
    const errors = Array.isArray(body.errors) ? body.errors : undefined
    throw new ApiError(
      body.message ?? `Request failed: ${response.status}`,
      response.status,
      errors,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function listFacilities(params: {
  skip?: number
  take?: number
  q?: string
  isActive?: boolean
  isVerified?: boolean
  kind?: FacilityKind
  operatorId?: string
}): Promise<FacilityListResponse> {
  const query = new URLSearchParams()
  if (params.skip !== undefined) query.set('skip', String(params.skip))
  if (params.take !== undefined) query.set('take', String(params.take))
  if (params.q) query.set('q', params.q)
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive))
  if (params.isVerified !== undefined) query.set('isVerified', String(params.isVerified))
  if (params.kind) query.set('kind', params.kind)
  if (params.operatorId) query.set('operatorId', params.operatorId)
  const qs = query.toString()
  return apiFetch<FacilityListResponse>(`/facilities${qs ? `?${qs}` : ''}`)
}

export function bulkFacilities(
  ids: string[],
  action: BulkFacilityAction,
  assignments?: AssignTariffInput[],
): Promise<{ affected: number }> {
  return apiFetch<{ affected: number }>('/facilities/bulk', {
    method: 'PATCH',
    body: JSON.stringify(
      action === 'assignTariff' ? { ids, action, assignments: assignments ?? [] } : { ids, action },
    ),
  })
}

export function getFacilityTariffAssignments(
  facilityId: string,
): Promise<FacilityTariffAssignmentsResponse> {
  return apiFetch<FacilityTariffAssignmentsResponse>(`/facilities/${facilityId}/tariff-assignments`)
}

export function assignFacilityTariff(
  facilityId: string,
  vehicleType: FacilityVehicleType,
  tariffPlanId: string | null,
): Promise<{ facilityId: string; vehicleType: FacilityVehicleType; tariffPlanId: string | null }> {
  return apiFetch<{
    facilityId: string
    vehicleType: FacilityVehicleType
    tariffPlanId: string | null
  }>(`/facilities/${facilityId}/tariff-plan`, {
    method: 'PATCH',
    body: JSON.stringify({ vehicleType, tariffPlanId }),
  })
}

export function adminMapFacilities(params: {
  north: number
  south: number
  east: number
  west: number
  q?: string
  isActive?: boolean
  isVerified?: boolean
  kind?: FacilityKind
  operatorId?: string
}): Promise<AdminMapResponse> {
  const query = new URLSearchParams()
  query.set('north', String(params.north))
  query.set('south', String(params.south))
  query.set('east', String(params.east))
  query.set('west', String(params.west))
  if (params.q) query.set('q', params.q)
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive))
  if (params.isVerified !== undefined) query.set('isVerified', String(params.isVerified))
  if (params.kind) query.set('kind', params.kind)
  if (params.operatorId) query.set('operatorId', params.operatorId)
  return apiFetch<AdminMapResponse>(`/facilities/map?${query.toString()}`)
}

export function getFacilityForEdit(id: string): Promise<AdminFacility> {
  return apiFetch<AdminFacility>(`/facilities/${id}/manage`)
}

export function createFacility(input: CreateFacilityInput): Promise<AdminFacility> {
  return apiFetch<AdminFacility>('/facilities', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateFacility(id: string, input: UpdateFacilityInput): Promise<AdminFacility> {
  return apiFetch<AdminFacility>(`/facilities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteFacility(id: string): Promise<void> {
  return apiFetch<void>(`/facilities/${id}`, { method: 'DELETE' })
}
