import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, AlertCircle, Smartphone } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { hasPlatformPermission } from '@spark/types'
import { Badge } from '@spark/ui'
import { PageHeader } from '@/components/PageHeader'
import { MobileUserActions } from '@/components/MobileUserActions'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { requireSession } from '@/lib/dal'
import { getMobileUser } from '@/lib/mobile-user-api'
import { MOBILE_STATUS_BADGE_VARIANT, formatMobileDate } from '@/lib/mobile-user-format'
import type { MobileUserDetail } from '@/lib/mobile-user-schema'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminMobileUserDetailPage({ params }: PageProps) {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'identity:mobile.read')) {
    redirect('/dashboard')
  }
  const canManage = hasPlatformPermission(session.user.role, 'identity:mobile.manage')

  const { id } = await params
  const [t, tList] = await Promise.all([
    getTranslations('adminMobileUsers.detail'),
    getTranslations('adminMobileUsers'),
  ])

  let user: MobileUserDetail | null = null
  let notFound = false
  try {
    user = await getMobileUser(id)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
    if (err instanceof ApiError && err.status === 404) notFound = true
  }

  const none = t('none')

  return (
    <>
      <Link href="/admin/mobile-users" className="facility-overview__back">
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
              <Smartphone size={24} strokeWidth={2} />
            </span>
            <PageHeader title={user.displayName ?? user.email} />
          </div>

          <div className="operator-status-row">
            <span className="operator-status-row__item">
              <span className="text-secondary">{t('status')}</span>
              <Badge variant={MOBILE_STATUS_BADGE_VARIANT[user.status]}>
                {tList(`status.${user.status}`)}
              </Badge>
            </span>
          </div>

          {canManage ? (
            <div className="panel-card panel-card--wide">
              <div className="panel-card__header">
                <h3 className="panel-card__title">{t('actions.title')}</h3>
              </div>
              <div className="panel-card__body panel-card__body--stack">
                {user.status === 'DELETED' ? (
                  <p className="text-secondary">{t('actions.deletedNote')}</p>
                ) : (
                  <MobileUserActions id={user.id} email={user.email} status={user.status} />
                )}
              </div>
            </div>
          ) : null}

          <div className="panel-card panel-card--wide">
            <div className="panel-card__header">
              <h3 className="panel-card__title">{t('account.title')}</h3>
            </div>
            <div className="panel-card__body">
              <div className="operator-detail-grid">
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('account.id')}</span>
                  <span className="operator-detail-grid__value mono">{user.id}</span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('account.email')}</span>
                  <span className="operator-detail-grid__value">{user.email}</span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('account.displayName')}</span>
                  <span className="operator-detail-grid__value">{user.displayName ?? none}</span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('account.created')}</span>
                  <span className="operator-detail-grid__value">
                    {formatMobileDate(user.createdAt)}
                  </span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('account.lastActive')}</span>
                  <span className="operator-detail-grid__value">
                    {user.lastActiveAt ? formatMobileDate(user.lastActiveAt) : none}
                  </span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('account.hasPassword')}</span>
                  <span className="operator-detail-grid__value">
                    {user.hasPassword ? t('yes') : t('no')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-card panel-card--wide">
            <div className="panel-card__header">
              <h3 className="panel-card__title">{t('methods.title')}</h3>
            </div>
            <div className="panel-card__body">
              {user.methods.length === 0 ? (
                <p className="text-secondary">{t('methods.empty')}</p>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('methods.table.provider')}</th>
                        <th>{t('methods.table.email')}</th>
                        <th>{t('methods.table.added')}</th>
                        <th>{t('methods.table.lastUsed')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.methods.map((method) => (
                        <tr key={method.provider}>
                          <td>
                            <Badge variant="neutral">{tList(`provider.${method.provider}`)}</Badge>
                          </td>
                          <td className="text-secondary">{method.email ?? none}</td>
                          <td className="text-secondary">{formatMobileDate(method.createdAt)}</td>
                          <td className="text-secondary">
                            {method.lastUsedAt ? formatMobileDate(method.lastUsedAt) : none}
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
              <h3 className="panel-card__title">{t('profile.title')}</h3>
            </div>
            <div className="panel-card__body">
              <div className="operator-detail-grid">
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('profile.appVersion')}</span>
                  <span className="operator-detail-grid__value">
                    {user.profile?.appVersion ?? none}
                  </span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('profile.locale')}</span>
                  <span className="operator-detail-grid__value">
                    {user.profile?.locale ?? none}
                  </span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('profile.lastActive')}</span>
                  <span className="operator-detail-grid__value">
                    {user.profile?.lastActiveAt
                      ? formatMobileDate(user.profile.lastActiveAt)
                      : none}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-card panel-card--wide">
            <div className="panel-card__header">
              <h3 className="panel-card__title">{t('counts.title')}</h3>
            </div>
            <div className="panel-card__body">
              <div className="operator-detail-grid">
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('counts.bookings')}</span>
                  <span className="operator-detail-grid__value">{user.counts.bookings}</span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('counts.vehicles')}</span>
                  <span className="operator-detail-grid__value">{user.counts.vehicles}</span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('counts.savedFacilities')}</span>
                  <span className="operator-detail-grid__value">{user.counts.savedFacilities}</span>
                </div>
                <div className="operator-detail-grid__item">
                  <span className="operator-detail-grid__label">{t('counts.reviews')}</span>
                  <span className="operator-detail-grid__value">{user.counts.reviews}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-card panel-card--wide">
            <div className="panel-card__header">
              <h3 className="panel-card__title">{t('subscription.title')}</h3>
            </div>
            <div className="panel-card__body">
              {user.subscription ? (
                <div className="operator-detail-grid">
                  <div className="operator-detail-grid__item">
                    <span className="operator-detail-grid__label">{t('subscription.plan')}</span>
                    <span className="operator-detail-grid__value">
                      {user.subscription.planName ?? none}
                    </span>
                  </div>
                  <div className="operator-detail-grid__item">
                    <span className="operator-detail-grid__label">{t('subscription.status')}</span>
                    <span className="operator-detail-grid__value">{user.subscription.status}</span>
                  </div>
                  <div className="operator-detail-grid__item">
                    <span className="operator-detail-grid__label">
                      {t('subscription.periodEnd')}
                    </span>
                    <span className="operator-detail-grid__value">
                      {user.subscription.currentPeriodEnd
                        ? formatMobileDate(user.subscription.currentPeriodEnd)
                        : none}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-secondary">{t('subscription.none')}</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
