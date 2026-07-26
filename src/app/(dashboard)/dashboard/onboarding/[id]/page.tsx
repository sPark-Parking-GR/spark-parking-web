import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import { PageHeader } from '@/components/PageHeader'
import { requireSession } from '@/lib/dal'
import { getOperatorDetailAction } from '@/lib/operator-actions'
import type { OperatorStatus } from '@/lib/operator-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

const OPERATOR_STATUS_VARIANT: Record<OperatorStatus, BadgeVariant> = {
  PENDING: 'warn',
  VERIFIED: 'ok',
  SUSPENDED: 'bad',
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

export default async function OperatorDetailPage({ params }: PageProps) {
  const session = await requireSession()
  if (session.user.role !== 'platform_admin') {
    redirect('/dashboard')
  }

  const { id } = await params
  const [t, tOnboarding, tFacilities, tTariffs] = await Promise.all([
    getTranslations('onboarding.detail'),
    getTranslations('onboarding'),
    getTranslations('facilities'),
    getTranslations('tariffs'),
  ])

  const operator = await getOperatorDetailAction(id)
  if (!operator) notFound()

  return (
    <>
      <Link href="/dashboard/onboarding" className="facility-overview__back">
        <ChevronLeft size={16} strokeWidth={2.5} aria-hidden="true" />
        {t('back')}
      </Link>

      <PageHeader
        title={operator.name}
        titleAccessory={
          <Badge variant={OPERATOR_STATUS_VARIANT[operator.status]}>
            {tOnboarding(`operatorStatus.${operator.status.toLowerCase()}`)}
          </Badge>
        }
      />

      <div className="panel-card panel-card--wide">
        <div className="panel-card__body">
          <h3 className="panel-card__title">{t('facilities.title')}</h3>
          {operator.facilities.length === 0 ? (
            <p className="text-secondary">{t('facilities.empty')}</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>{tFacilities('table.name')}</th>
                    <th>{tFacilities('table.status')}</th>
                    <th>{tFacilities('table.verified')}</th>
                  </tr>
                </thead>
                <tbody>
                  {operator.facilities.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <Link href={`/dashboard/facilities/${f.id}`} className="table-link">
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
                        {f.isVerified ? (
                          <Badge variant="ok">{tFacilities('status.verified')}</Badge>
                        ) : (
                          <Badge variant="warn">{tFacilities('status.pending')}</Badge>
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
        <div className="panel-card__body">
          <h3 className="panel-card__title">{t('plans.title')}</h3>
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
                        {p.isDefault ? <Badge variant="neutral">{tTariffs('table.default')}</Badge> : null}
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
        <div className="panel-card__body">
          <h3 className="panel-card__title">{t('members.title')}</h3>
          {operator.members.length === 0 ? (
            <p className="text-secondary">{t('members.empty')}</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('members.email')}</th>
                    <th>{t('members.role')}</th>
                    <th>{t('members.joined')}</th>
                  </tr>
                </thead>
                <tbody>
                  {operator.members.map((m) => (
                    <tr key={m.userId}>
                      <td>{m.email}</td>
                      <td className="text-secondary">{m.role}</td>
                      <td className="text-secondary">{dateFmt.format(new Date(m.createdAt))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
