import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { FacilityForm } from '@/components/FacilityForm'
import { DeleteFacilityButton } from '@/components/DeleteFacilityButton'
import { FacilityDetailTabs } from '@/components/FacilityDetailTabs'
import { FacilityOverviewPanel } from '@/components/FacilityOverviewPanel'
import {
  getFacilityForEdit,
  getFacilityTariffAssignments,
  ApiError,
  AuthRequiredError,
} from '@/lib/api'
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
  let tariff
  try {
    facility = await getFacilityForEdit(id)
    // Tariffs only apply to bookable facilities; catalog-only kinds skip both requests.
    if (facility.kind === 'BUSINESS') {
      const [plansResult, assignmentsResult] = await Promise.all([
        listTariffPlans(),
        getFacilityTariffAssignments(id),
      ])
      tariff = {
        facilityId: id,
        assignments: assignmentsResult.assignments,
        defaultPlan: assignmentsResult.defaultPlan,
        tariffPlans: plansResult.items,
      }
    }
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

      <PageHeader title={facility.name} titleAccessory={<DeleteFacilityButton id={id} />} />
      <FacilityDetailTabs active={activeTab} />
      {activeTab === 'manage' ? (
        <FacilityForm
          mode="edit"
          facility={facility}
          isPlatformAdmin={isPlatformAdmin}
          tariff={tariff}
        />
      ) : (
        <FacilityOverviewPanel facility={facility} />
      )}
    </>
  )
}
