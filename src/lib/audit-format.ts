type Translator = (key: string, values?: Record<string, string | number>) => string

export function formatRelativeTime(iso: string, t: Translator): string {
  const date = new Date(iso)
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000)

  if (minutes < 1) return t('time.justNow')
  if (minutes < 60) return t('time.minutesAgo', { count: minutes })

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('time.hoursAgo', { count: hours })

  const days = Math.floor(hours / 24)
  if (days === 1) return t('time.yesterday')
  if (days < 7) return t('time.daysAgo', { count: days })

  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

const ACTION_LABEL_KEYS: Record<string, string> = {
  'booking.created': 'bookingCreated',
  'booking.confirmed': 'bookingConfirmed',
  'booking.refunded': 'bookingRefunded',
  'booking.cancelled': 'bookingCancelled',
  'facility.created': 'facilityCreated',
  'facility.updated': 'facilityUpdated',
  'facility.deactivated': 'facilityDeactivated',
  'facility.tariff_assigned': 'facilityTariffAssigned',
  'facility.tariff_unassigned': 'facilityTariffUnassigned',
  'facility.bulk.enable': 'facilityBulkEnable',
  'facility.bulk.disable': 'facilityBulkDisable',
  'facility.bulk.deploy': 'facilityBulkDeploy',
  'facility.bulk.delete': 'facilityBulkDelete',
  'facility.bulk.assignTariff': 'facilityBulkAssignTariff',
  'tariff_plan.created': 'tariffPlanCreated',
  'tariff_plan.updated': 'tariffPlanUpdated',
  'tariff_plan.deleted': 'tariffPlanDeleted',
}

function humanize(action: string): string {
  return action.replace(/[._]/g, ' ')
}

export function actionLabel(t: Translator, action: string): string {
  const key = ACTION_LABEL_KEYS[action]
  return key ? t(`actions.${key}`) : humanize(action)
}

export type AuditTone = 'primary' | 'success' | 'warning' | 'danger'

export function actionTone(action: string): AuditTone {
  if (/deleted|deactivated|cancelled|unassigned|bulk\.delete|bulk\.disable/.test(action)) return 'danger'
  if (/created|confirmed|assigned|bulk\.enable|bulk\.deploy/.test(action)) return 'success'
  if (/updated|refunded/.test(action)) return 'warning'
  return 'primary'
}
