import { getTranslations } from 'next-intl/server'
import type { AuthUser } from '@spark/types'

export async function roleLabelFor(role: AuthUser['role']): Promise<string> {
  const t = await getTranslations('shell')
  const labels: Record<AuthUser['role'], string> = {
    guest: t('roleGuest'),
    user: t('roleUser'),
    operator_staff: t('roleOperatorStaff'),
    operator_admin: t('roleOperatorAdmin'),
    platform_admin: t('rolePlatformAdmin'),
    super_admin: t('roleSuperAdmin'),
  }
  return labels[role]
}
