import { notFound, redirect } from 'next/navigation'
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
    ? `Used by ${assignments.count} ${assignments.count === 1 ? 'facility' : 'facilities'} directly, plus ${assignments.implicitFacilityCount} more as the operator default.`
    : `Used by ${assignments.count} ${assignments.count === 1 ? 'facility' : 'facilities'}.`

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
