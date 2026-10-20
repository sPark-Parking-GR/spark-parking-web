import type { BadgeVariant } from '@spark/ui'
import type { MobileUserStatus } from './mobile-user-schema'

export const MOBILE_STATUS_BADGE_VARIANT: Record<MobileUserStatus, BadgeVariant> = {
  ACTIVE: 'ok',
  DEACTIVATED: 'neutral',
  SUSPENDED: 'warn',
  DELETED: 'bad',
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatMobileDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : dateFmt.format(date)
}
