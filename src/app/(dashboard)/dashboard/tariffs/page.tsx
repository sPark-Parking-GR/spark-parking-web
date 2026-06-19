import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { TariffPlanTable } from '@/components/TariffPlanTable'
import { FacilitySelect } from '@/components/FacilitySelect'
import { listFacilities, ApiError, AuthRequiredError } from '@/lib/api'
import { listTariffPlans } from '@/lib/tariff-api'
import type { TariffPlanListItem } from '@/lib/tariff-api'
import { getSession } from '@/lib/session'

interface PageProps {
  searchParams: Promise<{ facilityId?: string }>
}

export default async function TariffsPage({ searchParams }: PageProps) {
  const session = await getSession()
  if (!session.accessToken) redirect('/login')

  const { facilityId } = await searchParams

  let facilities
  try {
    facilities = await listFacilities({ take: 100 })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    throw err
  }

  let plans: TariffPlanListItem[] | undefined
  if (facilityId) {
    try {
      plans = (await listTariffPlans(facilityId)).items
    } catch (err) {
      if (err instanceof AuthRequiredError) redirect('/login')
      if (err instanceof ApiError && err.status === 404) plans = []
      else throw err
    }
  }

  return (
    <>
      <PageHeader
        title="Tariffs"
        description="Pick a facility, then configure its pricing plans."
        actions={
          facilityId ? (
            <Link href={`/dashboard/tariffs/new?facilityId=${encodeURIComponent(facilityId)}`} className="btn btn--primary">
              New plan
            </Link>
          ) : undefined
        }
      />

      <div className="table-toolbar">
        <FacilitySelect facilities={facilities.items} selectedId={facilityId ?? ''} />
      </div>

      {!facilityId ? (
        <EmptyState title="Select a facility" message="Choose a facility above to view and edit its tariff plans." />
      ) : plans && plans.length > 0 ? (
        <TariffPlanTable items={plans} facilityId={facilityId} />
      ) : (
        <EmptyState title="No tariff plans" message="Create the first pricing plan for this facility." />
      )}
    </>
  )
}
