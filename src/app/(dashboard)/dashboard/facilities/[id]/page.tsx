import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { FacilityForm } from '@/components/FacilityForm'
import { DeleteFacilityButton } from '@/components/DeleteFacilityButton'
import { FacilityDetailTabs } from '@/components/FacilityDetailTabs'
import { FacilityOverviewPanel } from '@/components/FacilityOverviewPanel'
import { getFacilityForEdit, getFacilityTariffAssignments, ApiError, AuthRequiredError } from '@/lib/api'
import { listTariffPlans } from '@/lib/tariff-api'
import { getSession } from '@/lib/session'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function EditFacilityPage({ params, searchParams }: PageProps) {
  const session = await getSession()
  if (!session.accessToken) redirect('/login')

  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab === 'manage' ? 'manage' : 'overview'

  let facility
  let tariffPlans
  let assignments
  let defaultPlan
  try {
    let plansResult
    let assignmentsResult
    ;[facility, plansResult, assignmentsResult] = await Promise.all([
      getFacilityForEdit(id),
      listTariffPlans(),
      getFacilityTariffAssignments(id),
    ])
    tariffPlans = plansResult.items
    assignments = assignmentsResult.assignments
    defaultPlan = assignmentsResult.defaultPlan
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound()
    throw err
  }

  const isPlatformAdmin = session.user?.role === 'platform_admin'
  const t = await getTranslations('facilities')

  return (
    <>
      <Link href="/dashboard/facilities" className="facility-overview__back">
        <ChevronLeft size={16} strokeWidth={2.5} aria-hidden="true" />
        {t('overview.backToFacilities')}
      </Link>

      <PageHeader
        title={facility.name}
        titleAccessory={<DeleteFacilityButton id={id} />}
      />
      <FacilityDetailTabs active={activeTab} />
      {activeTab === 'manage' ? (
        <FacilityForm
          mode="edit"
          facility={facility}
          isPlatformAdmin={isPlatformAdmin}
          tariff={{ facilityId: id, assignments, defaultPlan, tariffPlans }}
        />
      ) : (
        <FacilityOverviewPanel facility={facility} />
      )}
    </>
  )
}
