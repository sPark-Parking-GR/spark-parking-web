import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ChevronLeft,
  AlertCircle,
  Building2,
  ShieldOff,
  ShieldCheck,
  Archive,
  ArchiveRestore,
  Trash2,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { hasPlatformPermission } from '@spark/types'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import { PageHeader } from '@/components/PageHeader'
import { SuspendOperatorButton } from '@/components/SuspendOperatorButton'
import { ReactivateOperatorButton } from '@/components/ReactivateOperatorButton'
import { LifecycleActionButton } from '@/components/LifecycleActionButton'
import { OperatorMembersTable } from '@/components/OperatorMembersTable'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { requireSession } from '@/lib/dal'
import { getOperatorDetail } from '@/lib/operator-api'
import type {
  OperatorDetail,
  OperatorLifecycleStatus,
  OperatorStatus,
} from '@/lib/operator-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

const OPERATOR_STATUS_VARIANT: Record<OperatorStatus, BadgeVariant> = {
  PENDING: 'warn',
  VERIFIED: 'ok',
  SUSPENDED: 'bad',
}

const LIFECYCLE_VARIANT: Record<OperatorLifecycleStatus, BadgeVariant> = {
  ACTIVE: 'ok',
  ARCHIVED: 'warn',
  TOMBSTONED: 'bad',
  PURGED: 'neutral',
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export default async function AdminOperatorDetailPage({ params }: PageProps) {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'platform:tenant.read')) {
    redirect('/dashboard')
  }
  const canWrite = hasPlatformPermission(session.user.role, 'platform:tenant.write')
  const canPurge = hasPlatformPermission(session.user.role, 'platform:tenant.purge')
  const canGrantRoles = hasPlatformPermission(session.user.role, 'platform:role.grant')

  const { id } = await params
  const [t, tOnboarding, tFacilities, tTariffs, tAdminLifecycle] = await Promise.all([
    getTranslations('onboarding.detail'),
    getTranslations('onboarding'),
    getTranslations('facilities'),
    getTranslations('tariffs'),
    getTranslations('adminLifecycle'),
  ])

  let operator: OperatorDetail | null = null
  try {
    operator = await getOperatorDetail(id)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 404) notFound()
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
  }

  return (
    <>
      <Link href="/admin/operators" className="facility-overview__back">
        <ChevronLeft size={16} strokeWidth={2.5} aria-hidden="true" />
        {t('back')}
      </Link>

      {!operator ? (
        <p className="form-banner form-banner--error" role="alert">
          <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
          {t('loadError')}
        </p>
      ) : (
        <>
          <div className="operator-overview__header">
            <span className="operator-overview__icon" aria-hidden="true">
              <Building2 size={24} strokeWidth={2} />
            </span>
            <PageHeader
              title={operator.name}
              actions={
                canWrite || canPurge ? (
                  <div className="row-actions">
                    {canWrite && operator.status === 'VERIFIED' ? (
                      <SuspendOperatorButton
                        id={operator.id}
                        icon={<ShieldOff size={18} strokeWidth={2} aria-hidden="true" />}
                        iconOnly
                      />
                    ) : null}
                    {canWrite && operator.status === 'SUSPENDED' ? (
                      <ReactivateOperatorButton
                        id={operator.id}
                        icon={<ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />}
                        iconOnly
                      />
                    ) : null}
                    {canWrite && operator.lifecycleStatus === 'ACTIVE' ? (
                      <LifecycleActionButton
                        resourceType="operator"
                        resourceId={operator.id}
                        resourceLabel={operator.name}
                        action="archive"
                        icon={<Archive size={18} strokeWidth={2} aria-hidden="true" />}
                        iconOnly
                      />
                    ) : null}
                    {canWrite &&
                    (operator.lifecycleStatus === 'ARCHIVED' ||
                      operator.lifecycleStatus === 'TOMBSTONED') ? (
                      <LifecycleActionButton
                        resourceType="operator"
                        resourceId={operator.id}
                        resourceLabel={operator.name}
                        action="restore"
                        icon={<ArchiveRestore size={18} strokeWidth={2} aria-hidden="true" />}
                        iconOnly
                      />
                    ) : null}
                    {canPurge &&
                    (operator.lifecycleStatus === 'ACTIVE' ||
                      operator.lifecycleStatus === 'ARCHIVED') ? (
                      <LifecycleActionButton
                        resourceType="operator"
                        resourceId={operator.id}
                        resourceLabel={operator.name}
                        action="tombstone"
                        icon={<Trash2 size={18} strokeWidth={2} aria-hidden="true" />}
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
              <span className="text-secondary">{t('status.business')}</span>
              <Badge variant={OPERATOR_STATUS_VARIANT[operator.status]}>
                {tOnboarding(`operatorStatus.${operator.status.toLowerCase()}`)}
              </Badge>
            </span>
            <span className="operator-status-row__item">
              <span className="text-secondary">{t('status.lifecycle')}</span>
              <Badge variant={LIFECYCLE_VARIANT[operator.lifecycleStatus]}>
                {operator.lifecycleStatus === 'ACTIVE'
                  ? t('status.active')
                  : tAdminLifecycle(`status.${operator.lifecycleStatus}`)}
              </Badge>
            </span>
          </div>

          <div className="panel-card panel-card--wide">
            <div className="panel-card__header">
              <h3 className="panel-card__title">{t('identity.title')}</h3>
            </div>
            <div className="panel-card__body">
              <div className="operator-detail-grid">
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('identity.fields.id')}</span>
                  <span className="operator-detail-grid__value mono">{operator.id}</span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">
                    {t('identity.fields.created')}
                  </span>
                  <span className="operator-detail-grid__value">
                    {dateFmt.format(new Date(operator.createdAt))}
                  </span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">
                    {t('identity.fields.facilities')}
                  </span>
                  <span className="operator-detail-grid__value">{operator.facilityCount}</span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">
                    {t('identity.fields.members')}
                  </span>
                  <span className="operator-detail-grid__value">{operator.memberCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-card panel-card--wide">
            <div className="panel-card__header">
              <h3 className="panel-card__title">{t('facilities.title')}</h3>
            </div>
            <div className="panel-card__body">
              {operator.facilities.length === 0 ? (
                <p className="text-secondary">{t('facilities.empty')}</p>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{tFacilities('table.name')}</th>
                        <th>{tFacilities('table.status')}</th>
                        <th>{tFacilities('table.published')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operator.facilities.map((f) => (
                        <tr key={f.id}>
                          <td>
                            <Link href={`/admin/facilities/${f.id}`} className="table-link">
                              {f.name}
                            </Link>
                            <span className="table__sub">{f.address}</span>
                          </td>
                          <td>
                            {f.isActive ? (
                              <Badge variant="ok">{tFacilities('status.active')}</Badge>
                            ) : (
                              <Badge variant="neutral">{tFacilities('status.inactive')}</Badge>
                            )}
                          </td>
                          <td>
                            {f.isPublished ? (
                              <Badge variant="ok">{tFacilities('status.published')}</Badge>
                            ) : (
                              <Badge variant="warn">{tFacilities('status.unpublished')}</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="panel-card panel-card--wide">
            <div className="panel-card__header">
              <h3 className="panel-card__title">{t('plans.title')}</h3>
            </div>
            <div className="panel-card__body">
              {operator.plans.length === 0 ? (
                <p className="text-secondary">{t('plans.empty')}</p>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{tTariffs('table.name')}</th>
                        <th>{tTariffs('table.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operator.plans.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <Link href={`/dashboard/tariffs/${p.id}`} className="table-link">
                              {p.name}
                            </Link>
                            {p.isDefault ? (
                              <Badge variant="neutral">{tTariffs('table.default')}</Badge>
                            ) : null}
                          </td>
                          <td>
                            {p.isActive ? (
                              <Badge variant="ok">{tTariffs('table.active')}</Badge>
                            ) : (
                              <Badge variant="neutral">{tTariffs('table.inactive')}</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="panel-card panel-card--wide">
            <div className="panel-card__header">
              <h3 className="panel-card__title">{t('members.title')}</h3>
            </div>
            <div className="panel-card__body">
              {operator.members.length === 0 ? (
                <p className="text-secondary">{t('members.empty')}</p>
              ) : (
                <OperatorMembersTable
                  operatorId={operator.id}
                  operatorStatus={operator.status}
                  members={operator.members}
                  canGrantRoles={canGrantRoles}
                  currentUserId={session.user.id}
                />
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
