import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, AlertCircle, User, ShieldOff, ShieldCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { hasPlatformPermission } from '@spark/types'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import { PageHeader } from '@/components/PageHeader'
import { SuspendUserButton } from '@/components/SuspendUserButton'
import { RestoreUserButton } from '@/components/RestoreUserButton'
import { AssignUserRoleButton } from '@/components/AssignUserRoleButton'
import { DemoteUserButton } from '@/components/DemoteUserButton'
import { ApproveUserDemotionButton } from '@/components/ApproveUserDemotionButton'
import { RejectUserDemotionButton } from '@/components/RejectUserDemotionButton'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { requireSession } from '@/lib/dal'
import { getUserDetail, listUserApprovals } from '@/lib/identity-api'
import type { IdentityLifecycleStatus, IdentityRole, IdentityUserDetail } from '@/lib/identity-api'
import { actionLabel, actionTone, formatRelativeTime } from '@/lib/audit-format'

interface PageProps {
  params: Promise<{ id: string }>
}

const ROLE_BADGE_VARIANT: Record<IdentityRole, BadgeVariant> = {
  USER: 'neutral',
  OPERATOR_STAFF: 'neutral',
  OPERATOR_ADMIN: 'ok',
  PLATFORM_ADMIN: 'warn',
  SUPER_ADMIN: 'bad',
}

const LIFECYCLE_BADGE_VARIANT: Record<IdentityLifecycleStatus, BadgeVariant> = {
  ACTIVE: 'ok',
  ARCHIVED: 'warn',
  TOMBSTONED: 'bad',
  PURGED: 'neutral',
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export default async function AdminUserDetailPage({ params }: PageProps) {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'identity:user.read')) {
    redirect('/dashboard')
  }
  const canWriteLifecycle = hasPlatformPermission(session.user.role, 'identity:user.lifecycle')
  const canAssignRole = hasPlatformPermission(session.user.role, 'identity:role.assign')

  const { id } = await params
  const [t, tRole, tStatus, tAudit, tMemberRole] = await Promise.all([
    getTranslations('adminUsers.detail'),
    getTranslations('adminUsers.role'),
    getTranslations('adminUsers.status'),
    getTranslations('insights.audit'),
    getTranslations('onboarding.detail.members.roleOptions'),
  ])

  let user: IdentityUserDetail | null = null
  let notFound = false
  try {
    user = await getUserDetail(id)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
    if (err instanceof ApiError && err.status === 404) notFound = true
  }

  let pendingApproval: Awaited<ReturnType<typeof listUserApprovals>>['items'][number] | null = null
  if (user && canAssignRole && user.role === 'SUPER_ADMIN') {
    try {
      const approvals = await listUserApprovals()
      pendingApproval = approvals.items.find((a) => a.resourceId === user!.id) ?? null
    } catch {
      pendingApproval = null
    }
  }

  const isSelf = user ? session.user.id === user.id : false

  return (
    <>
      <Link href="/admin/users" className="facility-overview__back">
        <ChevronLeft size={16} strokeWidth={2.5} aria-hidden="true" />
        {t('back')}
      </Link>

      {!user ? (
        <p className="form-banner form-banner--error" role="alert">
          <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
          {notFound ? t('notFound') : t('loadError')}
        </p>
      ) : (
        <>
          <div className="operator-overview__header">
            <span className="operator-overview__icon" aria-hidden="true">
              <User size={24} strokeWidth={2} />
            </span>
            <PageHeader
              title={user.displayName ?? user.email}
              actions={
                canWriteLifecycle && user.role !== 'SUPER_ADMIN' && !user.anonymisedAt ? (
                  <div className="row-actions">
                    {user.lifecycleStatus === 'ACTIVE' ? (
                      <SuspendUserButton
                        id={user.id}
                        icon={<ShieldOff size={18} strokeWidth={2} aria-hidden="true" />}
                        iconOnly
                      />
                    ) : null}
                    {user.lifecycleStatus === 'ARCHIVED' || user.lifecycleStatus === 'TOMBSTONED' ? (
                      <RestoreUserButton
                        id={user.id}
                        icon={<ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />}
                        iconOnly
                      />
                    ) : null}
                  </div>
                ) : undefined
              }
            />
          </div>

          <div className="operator-status-row">
            <span className="operator-status-row__item">
              <span className="text-secondary">{t('lifecycle.status')}</span>
              <Badge variant={LIFECYCLE_BADGE_VARIANT[user.lifecycleStatus]}>
                {tStatus(user.lifecycleStatus)}
              </Badge>
            </span>
            <span className="operator-status-row__item">
              <span className="text-secondary">{t('role.current')}</span>
              <Badge variant={ROLE_BADGE_VARIANT[user.role]}>{tRole(user.role)}</Badge>
            </span>
            {user.anonymisedAt ? (
              <span className="operator-status-row__item">
                <Badge variant="neutral">{t('lifecycle.anonymisedBadge')}</Badge>
              </span>
            ) : null}
          </div>

          {user.anonymisedAt ? (
            <p className="form-banner form-banner--error" role="status">
              <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
              {t('lifecycle.anonymisedNote')}
            </p>
          ) : null}

          <div className="panel-card panel-card--wide">
            <div className="panel-card__header">
              <h3 className="panel-card__title">{t('identity.title')}</h3>
            </div>
            <div className="panel-card__body">
              <div className="operator-detail-grid">
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('identity.fields.id')}</span>
                  <span className="operator-detail-grid__value mono">{user.id}</span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('identity.fields.email')}</span>
                  <span className="operator-detail-grid__value">{user.email}</span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">
                    {t('identity.fields.displayName')}
                  </span>
                  <span className="operator-detail-grid__value">
                    {user.displayName ?? t('identity.noDisplayName')}
                  </span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">
                    {t('identity.fields.emailVerified')}
                  </span>
                  <span className="operator-detail-grid__value">
                    {user.emailVerified ? t('identity.verified') : t('identity.unverified')}
                  </span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('identity.fields.created')}</span>
                  <span className="operator-detail-grid__value">
                    {dateFmt.format(new Date(user.createdAt))}
                  </span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('identity.fields.updated')}</span>
                  <span className="operator-detail-grid__value">
                    {dateFmt.format(new Date(user.updatedAt))}
                  </span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">
                    {t('identity.fields.sessionsValidFrom')}
                  </span>
                  <span className="operator-detail-grid__value">
                    {user.sessionsValidFrom
                      ? dateFmt.format(new Date(user.sessionsValidFrom))
                      : t('lifecycle.none')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-card panel-card--wide">
            <div className="panel-card__header">
              <h3 className="panel-card__title">{t('lifecycle.title')}</h3>
            </div>
            <div className="panel-card__body">
              <div className="operator-detail-grid">
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('lifecycle.changedAt')}</span>
                  <span className="operator-detail-grid__value">
                    {user.lifecycleChangedAt
                      ? dateFmt.format(new Date(user.lifecycleChangedAt))
                      : t('lifecycle.none')}
                  </span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('lifecycle.changedBy')}</span>
                  <span className="operator-detail-grid__value mono">
                    {user.lifecycleChangedBy ?? t('lifecycle.none')}
                  </span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('lifecycle.reason')}</span>
                  <span className="operator-detail-grid__value">
                    {user.lifecycleReason ?? t('lifecycle.none')}
                  </span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('lifecycle.purgeAfter')}</span>
                  <span className="operator-detail-grid__value">
                    {user.purgeAfter ? dateFmt.format(new Date(user.purgeAfter)) : t('lifecycle.none')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-card panel-card--wide">
            <div className="panel-card__header">
              <h3 className="panel-card__title">{t('memberships.title')}</h3>
            </div>
            <div className="panel-card__body">
              {user.memberships.length === 0 ? (
                <p className="text-secondary">{t('memberships.empty')}</p>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('memberships.table.operator')}</th>
                        <th>{t('memberships.table.role')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.memberships.map((m) => (
                        <tr key={m.operatorId}>
                          <td>
                            <Link href={`/admin/operators/${m.operatorId}`} className="table-link">
                              {m.operatorName}
                            </Link>
                          </td>
                          <td className="text-secondary">{tMemberRole(m.role)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {canAssignRole && !user.anonymisedAt ? (
            <div className="panel-card panel-card--wide">
              <div className="panel-card__header">
                <h3 className="panel-card__title">{t('role.title')}</h3>
              </div>
              <div className="panel-card__body">
                {user.role === 'SUPER_ADMIN' ? (
                  <p className="text-secondary">{t('role.superAdminNote')}</p>
                ) : isSelf ? (
                  <p className="text-secondary">{t('role.selfNote')}</p>
                ) : (
                  <AssignUserRoleButton id={user.id} email={user.email} currentRole={user.role} />
                )}
              </div>
            </div>
          ) : null}

          {canAssignRole && user.role === 'SUPER_ADMIN' && !user.anonymisedAt ? (
            <div className="panel-card panel-card--wide">
              <div className="panel-card__header">
                <h3 className="panel-card__title">{t('demote.title')}</h3>
              </div>
              <div className="panel-card__body">
                <p className="text-secondary">{t('demote.explain')}</p>
                {isSelf ? (
                  <p className="text-secondary">{t('demote.selfNote')}</p>
                ) : pendingApproval ? null : (
                  <DemoteUserButton id={user.id} email={user.email} />
                )}
              </div>
            </div>
          ) : null}

          {canAssignRole && pendingApproval ? (
            <div className="panel-card panel-card--wide">
              <div className="panel-card__header">
                <h3 className="panel-card__title">{t('approval.title')}</h3>
              </div>
              <div className="panel-card__body">
                <p className="text-secondary">
                  {t('approval.body', {
                    requestedByRole: pendingApproval.requestedByRole,
                    reason: pendingApproval.reason,
                  })}
                </p>
                <p className="text-secondary">
                  {t('approval.expiresAt')}: {dateFmt.format(new Date(pendingApproval.expiresAt))}
                </p>
                <div className="table-actions">
                  {pendingApproval.requestedBy === session.user.id ? (
                    <span className="text-secondary">{t('approval.selfRequestNote')}</span>
                  ) : (
                    <ApproveUserDemotionButton
                      approvalId={pendingApproval.id}
                      userId={user.id}
                      email={user.email}
                    />
                  )}
                  <RejectUserDemotionButton
                    approvalId={pendingApproval.id}
                    userId={user.id}
                    email={user.email}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="panel-card panel-card--wide">
            <div className="panel-card__header">
              <h3 className="panel-card__title">{t('activity.title')}</h3>
            </div>
            <div className="panel-card__body">
              {user.recentActivity.length === 0 ? (
                <p className="text-secondary">{t('activity.empty')}</p>
              ) : (
                <div className="audit-card">
                  {user.recentActivity.map((entry) => (
                    <div key={entry.id} className={`audit-row audit-row--${actionTone(entry.action)}`}>
                      <span className="audit-row__avatar" aria-hidden="true">
                        <span className="audit-row__dot" />
                      </span>
                      <div className="audit-row__body">
                        <p className="audit-row__line">
                          <b className="audit-row__actor mono">
                            {entry.actorId ? entry.actorId.slice(0, 10) : tAudit('system')}
                          </b>{' '}
                          {actionLabel(tAudit, entry.action)}
                        </p>
                        <p className="audit-row__target">{entry.actorRole ?? '—'}</p>
                      </div>
                      <span className="audit-row__when">
                        {formatRelativeTime(entry.createdAt, tAudit)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
