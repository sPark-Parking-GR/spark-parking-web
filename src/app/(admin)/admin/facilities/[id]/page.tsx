import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { FacilityForm } from '@/components/FacilityForm'
import { DeleteFacilityButton } from '@/components/DeleteFacilityButton'
import { PublishFacilityToggle } from '@/components/PublishFacilityToggle'
import { FacilityDetailTabs } from '@/components/FacilityDetailTabs'
import { FacilityOverviewPanel } from '@/components/FacilityOverviewPanel'
import { ManagersPanel } from '@/components/ManagersPanel'
import {
  getFacilityForEdit,
  getFacilityTariffAssignments,
  ApiError,
  AuthRequiredError,
} from '@/lib/api'
import { listTariffPlans } from '@/lib/tariff-api'
import { getFacilityManagersAction } from '@/lib/facility-actions'
import { requireSession } from '@/lib/dal'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminEditFacilityPage({ params, searchParams }: PageProps) {
  const session = await requireSession()

  const { id } = await params
  const { tab } = await searchParams

  // Kicked off before the facility/tariff awaits below so it resolves concurrently with
  // them rather than adding a serial round trip; the action swallows 403/404 to null so an
  // admin who is only STAFF on the owning operator gets no panel instead of a broken one.
  const managersPromise = getFacilityManagersAction(id)

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

  const managers = await managersPromise
  const activeTab =
    tab === 'manage' ? 'manage' : tab === 'managers' && managers ? 'managers' : 'overview'

  const t = await getTranslations('facilities')

  return (
    <>
      <Link href="/admin/facilities" className="facility-overview__back">
        <ChevronLeft size={16} strokeWidth={2.5} aria-hidden="true" />
        {t('overview.backToFacilities')}
      </Link>

      <PageHeader
        title={facility.name}
        titleAccessory={
          <>
            <PublishFacilityToggle
              id={id}
              initialIsActive={facility.isActive}
              initialIsPublished={facility.isPublished}
            />
            <DeleteFacilityButton id={id} />
          </>
        }
      />
      <FacilityDetailTabs active={activeTab} showManagers={managers !== null} />
      {activeTab === 'manage' ? (
        <FacilityForm mode="edit" facility={facility} isPlatformAdmin tariff={tariff} />
      ) : activeTab === 'managers' && managers ? (
        <ManagersPanel
          kind="facility"
          resourceId={id}
          namespace="facilities"
          initial={managers}
          currentUserId={session.user.id}
          isPlatformAdmin
        />
      ) : (
        <FacilityOverviewPanel facility={facility} />
      )}
    </>
  )
}
