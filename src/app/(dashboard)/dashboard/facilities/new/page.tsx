import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { FacilityForm } from '@/components/FacilityForm'
import { getSession } from '@/lib/session'
import { listFacilities } from '@/lib/api'
import { loadPage } from '@/lib/dal'
import { listOperatorsAction } from '@/lib/operator-actions'

export default async function NewFacilityPage() {
  const t = await getTranslations('facilities')
  const session = await getSession()
  if (!session.accessToken) redirect('/login')

  const isPlatformAdmin = session.user?.role === 'platform_admin'

  // One-facility-per-operator cap: platform_admin picks the operator explicitly in
  // the form below, so only self-service operator roles are gated here.
  if (!isPlatformAdmin) {
    const { total } = await loadPage(() => listFacilities({ take: 1 }))
    if (total > 0) {
      redirect('/dashboard/facilities?facilityLimit=1')
    }
  }

  const operators = isPlatformAdmin ? await listOperatorsAction() : undefined

  return (
    <>
      <PageHeader title={t('actions.newFacility')} />
      <FacilityForm mode="create" isPlatformAdmin={isPlatformAdmin} operators={operators} />
    </>
  )
}
