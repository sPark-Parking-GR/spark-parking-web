import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { FacilityForm } from '@/components/FacilityForm'
import { hasHeadroomFor } from '@/lib/plan-headroom'
import { requireSession } from '@/lib/dal'

export default async function NewFacilityPage() {
  const t = await getTranslations('facilities')
  await requireSession()

  const canCreateFacility = await hasHeadroomFor('facilities')
  if (!canCreateFacility) {
    redirect('/dashboard/facilities?facilityLimit=1')
  }

  return (
    <>
      <PageHeader title={t('actions.newFacility')} />
      <FacilityForm mode="create" />
    </>
  )
}
