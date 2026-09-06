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

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export type AuditTone = 'primary' | 'success' | 'warning' | 'danger'

/**
 * Every audit action the API writes, with the tone it renders in.
 *
 * Exhaustive on purpose, and one table rather than two. What this replaced was a partial
 * label map beside a regex over the action string, and each half failed in its own way:
 * an action nobody remembered to add fell through to humanize() and rendered in a visibly
 * different voice from its neighbours, while the regex matched substrings — `unassigned`
 * contains `assigned`, `unpublish` contains `publish`, `purge_requested` contains `purge`
 * — so a row's tone depended on the order of the clauses rather than on what it meant.
 *
 * The `deactivated` and `deleted` entries name actions the API no longer writes. They stay
 * because the audit log is a historical record: rows written before those actions were
 * renamed still have to render, and retiring a label silently orphans the past.
 */
const ACTION_META: Record<string, { key: string; tone: AuditTone }> = {
  'account.deleted': { key: 'accountDeleted', tone: 'danger' },

  'booking.created': { key: 'bookingCreated', tone: 'success' },
  'booking.confirmed': { key: 'bookingConfirmed', tone: 'success' },
  'booking.cancelled': { key: 'bookingCancelled', tone: 'danger' },
  'booking.refunded': { key: 'bookingRefunded', tone: 'warning' },
  'booking.refund_requested': { key: 'bookingRefundRequested', tone: 'warning' },
  'booking.refund_failed': { key: 'bookingRefundFailed', tone: 'danger' },
  'booking.checked_in': { key: 'bookingCheckedIn', tone: 'primary' },
  'booking.checked_out': { key: 'bookingCheckedOut', tone: 'primary' },

  'facility.created': { key: 'facilityCreated', tone: 'success' },
  'facility.updated': { key: 'facilityUpdated', tone: 'warning' },
  'facility.archived': { key: 'facilityArchived', tone: 'danger' },
  'facility.restored': { key: 'facilityRestored', tone: 'success' },
  'facility.tombstoned': { key: 'facilityTombstoned', tone: 'danger' },
  'facility.purged': { key: 'facilityPurged', tone: 'danger' },
  'facility.managers_changed': { key: 'facilityManagersChanged', tone: 'warning' },
  'facility.tariff_assigned': { key: 'facilityTariffAssigned', tone: 'success' },
  'facility.tariff_unassigned': { key: 'facilityTariffUnassigned', tone: 'danger' },
  'facility.deactivated': { key: 'facilityDeactivated', tone: 'danger' },

  'facility.bulk.enable': { key: 'facilityBulkEnable', tone: 'success' },
  'facility.bulk.disable': { key: 'facilityBulkDisable', tone: 'danger' },
  'facility.bulk.deploy': { key: 'facilityBulkDeploy', tone: 'success' },
  'facility.bulk.delete': { key: 'facilityBulkDelete', tone: 'danger' },
  'facility.bulk.publish': { key: 'facilityBulkPublish', tone: 'success' },
  'facility.bulk.unpublish': { key: 'facilityBulkUnpublish', tone: 'danger' },
  'facility.bulk.assignTariff': { key: 'facilityBulkAssignTariff', tone: 'success' },

  'tariff_plan.created': { key: 'tariffPlanCreated', tone: 'success' },
  'tariff_plan.updated': { key: 'tariffPlanUpdated', tone: 'warning' },
  'tariff_plan.archived': { key: 'tariffPlanArchived', tone: 'danger' },
  'tariff_plan.restored': { key: 'tariffPlanRestored', tone: 'success' },
  'tariff_plan.tombstoned': { key: 'tariffPlanTombstoned', tone: 'danger' },
  'tariff_plan.purged': { key: 'tariffPlanPurged', tone: 'danger' },
  'tariff_plan.managers_changed': { key: 'tariffPlanManagersChanged', tone: 'warning' },
  'tariff_plan.deleted': { key: 'tariffPlanDeleted', tone: 'danger' },
  'tariff_plan.deactivated': { key: 'tariffPlanDeactivated', tone: 'danger' },

  'operator.archived': { key: 'operatorArchived', tone: 'danger' },
  'operator.restored': { key: 'operatorRestored', tone: 'success' },
  'operator.tombstoned': { key: 'operatorTombstoned', tone: 'danger' },
  'operator.purged': { key: 'operatorPurged', tone: 'danger' },
  'operator.suspended': { key: 'operatorSuspended', tone: 'danger' },
  'operator.reactivated': { key: 'operatorReactivated', tone: 'success' },

  'operator_member.removed': { key: 'operatorMemberRemoved', tone: 'danger' },
  'operator_member.role_changed': { key: 'operatorMemberRoleChanged', tone: 'warning' },
  'operator_member.scopes_changed': { key: 'operatorMemberScopesChanged', tone: 'warning' },

  'operator_subscription.assigned': { key: 'operatorSubscriptionAssigned', tone: 'success' },
  'operator_subscription.override_set': {
    key: 'operatorSubscriptionOverrideSet',
    tone: 'warning',
  },
  'operator_subscription.upgrade_requested': {
    key: 'operatorSubscriptionUpgradeRequested',
    tone: 'primary',
  },
  'operator_subscription.quota_threshold_warned': {
    key: 'operatorSubscriptionQuotaThresholdWarned',
    tone: 'warning',
  },

  'subscription_plan.created': { key: 'subscriptionPlanCreated', tone: 'success' },
  'subscription_plan.updated': { key: 'subscriptionPlanUpdated', tone: 'warning' },
  'subscription_plan.archived': { key: 'subscriptionPlanArchived', tone: 'danger' },

  'driver_subscription.assigned': { key: 'driverSubscriptionAssigned', tone: 'success' },
  'driver_subscription.override_set': {
    key: 'driverSubscriptionOverrideSet',
    tone: 'warning',
  },

  'driver_subscription.billing_event_processed': {
    key: 'driverSubscriptionBillingEventProcessed',
    tone: 'primary',
  },
  'driver_subscription.savings_summary_sent': {
    key: 'driverSubscriptionSavingsSummarySent',
    tone: 'primary',
  },

  'driver_subscription_plan.created': { key: 'driverSubscriptionPlanCreated', tone: 'success' },
  'driver_subscription_plan.updated': { key: 'driverSubscriptionPlanUpdated', tone: 'warning' },
  'driver_subscription_plan.archived': { key: 'driverSubscriptionPlanArchived', tone: 'danger' },

  'user.archived': { key: 'userArchived', tone: 'danger' },
  'user.restored': { key: 'userRestored', tone: 'success' },
  'user.tombstoned': { key: 'userTombstoned', tone: 'danger' },
  'user.purged': { key: 'userPurged', tone: 'danger' },
  'user.purge_anonymised': { key: 'userPurgeAnonymised', tone: 'danger' },
  'user.role_changed': { key: 'userRoleChanged', tone: 'warning' },
  'user.demotion_requested': { key: 'userDemotionRequested', tone: 'warning' },
  'user.demotion_rejected': { key: 'userDemotionRejected', tone: 'primary' },
  'user.demoted': { key: 'userDemoted', tone: 'danger' },

  'invite.created': { key: 'inviteCreated', tone: 'success' },
  'invite.accepted': { key: 'inviteAccepted', tone: 'success' },
  'invite.resent': { key: 'inviteResent', tone: 'primary' },
  'invite.revoked': { key: 'inviteRevoked', tone: 'danger' },

  'admin_invite.created': { key: 'adminInviteCreated', tone: 'success' },
  'admin_invite.resent': { key: 'adminInviteResent', tone: 'primary' },
  'admin_invite.revoked': { key: 'adminInviteRevoked', tone: 'danger' },
  'admin_invite.accepted': { key: 'adminInviteAccepted', tone: 'success' },

  'lifecycle.purge_requested': { key: 'lifecyclePurgeRequested', tone: 'warning' },
  'lifecycle.purge_approved': { key: 'lifecyclePurgeApproved', tone: 'danger' },
  'lifecycle.purge_rejected': { key: 'lifecyclePurgeRejected', tone: 'primary' },
  'lifecycle.purged': { key: 'lifecyclePurged', tone: 'danger' },
}

function humanize(action: string): string {
  return action.replace(/[._]/g, ' ')
}

/** Every action the filter dropdown can offer, in the same order as ACTION_META above. */
export const AUDIT_ACTIONS: string[] = Object.keys(ACTION_META)

export function actionLabel(t: Translator, action: string): string {
  const meta = ACTION_META[action]
  return meta ? t(`actions.${meta.key}`) : humanize(action)
}

export function actionTone(action: string): AuditTone {
  return ACTION_META[action]?.tone ?? 'primary'
}
