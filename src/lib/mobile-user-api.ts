import { apiFetch } from './api'
import { assertMobilePermission } from './mobile-user-access'
import {
  mobileUserDetailSchema,
  mobileUserIdSchema,
  mobileUserListQuerySchema,
  mobileUserListSchema,
} from './mobile-user-schema'
import type { MobileUserDetail, MobileUserList, MobileUserListQuery } from './mobile-user-schema'

export async function listMobileUsers(query: MobileUserListQuery): Promise<MobileUserList> {
  await assertMobilePermission('identity:mobile.read')
  const parsed = mobileUserListQuerySchema.parse(query)
  const params = new URLSearchParams()
  if (parsed.search) params.set('search', parsed.search)
  if (parsed.status) params.set('status', parsed.status)
  if (parsed.provider) params.set('provider', parsed.provider)
  if (parsed.skip !== undefined) params.set('skip', String(parsed.skip))
  if (parsed.take !== undefined) params.set('take', String(parsed.take))
  const qs = params.toString()
  const body = await apiFetch<unknown>(`/admin/mobile-users${qs ? `?${qs}` : ''}`)
  return mobileUserListSchema.parse(body)
}

export async function getMobileUser(id: string): Promise<MobileUserDetail> {
  await assertMobilePermission('identity:mobile.read')
  const body = await apiFetch<unknown>(`/admin/mobile-users/${mobileUserIdSchema.parse(id)}`)
  return mobileUserDetailSchema.parse(body)
}
