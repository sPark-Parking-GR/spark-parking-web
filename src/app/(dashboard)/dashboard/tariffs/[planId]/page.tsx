import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { TariffEditor } from '@/components/TariffEditor'
import { DeleteTariffButton } from '@/components/DeleteTariffButton'
import { getTariffPlan, getTariffAssignments, listTariffPlans } from '@/lib/tariff-api'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { getSession } from '@/lib/session'

interface PageProps {
  params: Promise<{ planId: string }>
}

export default async function EditTariffPlanPage({ params }: PageProps) {
  const session = await getSession()
  if (!session.accessToken) redirect('/login')

  const { planId } = await params

  const t = await getTranslations('tariffs')

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
      <TariffEditor mode="edit" planId={planId} plan={detail} plans={plans.items} />
    </>
  )
}
