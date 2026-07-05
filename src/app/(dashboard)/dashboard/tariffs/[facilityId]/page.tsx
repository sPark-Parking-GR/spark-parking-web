import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { TariffPlanTable } from '@/components/TariffPlanTable'
import { getFacilityForEdit, ApiError, AuthRequiredError } from '@/lib/api'
import { listTariffPlans } from '@/lib/tariff-api'
import { requireSession } from '@/lib/dal'

interface PageProps {
  params: Promise<{ facilityId: string }>
}

export default async function FacilityTariffsPage({ params }: PageProps) {
  await requireSession()

  const { facilityId } = await params

  let facility
  let plans
  try {
    facility = await getFacilityForEdit(facilityId)
    plans = (await listTariffPlans(facilityId)).items
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound()
    throw err
  }

  return (
    <>
      <PageHeader
        title={facility.name}
        description={facility.address}
        actions={
          <Link href={`/dashboard/tariffs/${facilityId}/new`} className="btn btn--primary">
            New plan
          </Link>
        }
      />

      {plans.length > 0 ? (
        <TariffPlanTable items={plans} facilityId={facilityId} />
      ) : (
        <EmptyState title="No tariff plans" message="Create the first pricing plan for this facility." />
      )}
    </>
  )
}
