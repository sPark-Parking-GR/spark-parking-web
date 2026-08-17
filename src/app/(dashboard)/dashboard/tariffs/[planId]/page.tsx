import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { TariffEditor } from '@/components/TariffEditor'
import { DeleteTariffButton } from '@/components/DeleteTariffButton'
import { ManagersPanel } from '@/components/ManagersPanel'
import { getTariffPlan, getTariffAssignments, listTariffPlans } from '@/lib/tariff-api'
import { getTariffPlanManagersAction } from '@/lib/tariff-actions'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { getActiveSession } from '@/lib/session'

interface PageProps {
  params: Promise<{ planId: string }>
}

export default async function EditTariffPlanPage({ params }: PageProps) {
  const session = await getActiveSession()
  if (!session.accessToken) redirect('/login')

  const { planId } = await params

  const t = await getTranslations('tariffs')

  const canManageAccess =
    session.user?.role === 'operator_admin' || session.user?.role === 'platform_admin'
  // Kicked off before the plan/assignment awaits below so it resolves concurrently with
  // them rather than adding a serial round trip; the action swallows 403/404 to null so an
  // admin who is only STAFF on the owning operator gets no panel instead of a broken one.
  const managersPromise = canManageAccess
    ? getTariffPlanManagersAction(planId)
    : Promise.resolve(null)

  let detail
  let assignments
  let plans
  try {
    ;[detail, assignments, plans] = await Promise.all([
      getTariffPlan(planId),
      getTariffAssignments(planId),
      listTariffPlans(),
    ])
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound()
    throw err
  }

  const managers = await managersPromise

  const description = assignments.isDefault
    ? t('detail.descriptionDefault', {
        count: assignments.count,
        implicitCount: assignments.implicitFacilityCount,
      })
    : t('detail.description', { count: assignments.count })

  return (
    <>
      <PageHeader
        title={detail.name}
        description={description}
        titleAccessory={<DeleteTariffButton planId={planId} plans={plans.items} />}
      />
      {managers ? (
        <ManagersPanel
          kind="tariffPlan"
          resourceId={planId}
          namespace="tariffs"
          initial={managers}
          currentUserId={session.user?.id ?? ''}
          isPlatformAdmin={session.user?.role === 'platform_admin'}
        />
      ) : null}
      <TariffEditor mode="edit" planId={planId} plan={detail} plans={plans.items} />
    </>
  )
}
