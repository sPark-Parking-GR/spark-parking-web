import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { FacilityForm } from '@/components/FacilityForm'
import { listFacilities } from '@/lib/api'
import { loadPage, requireSession } from '@/lib/dal'

export default async function NewFacilityPage() {
  const t = await getTranslations('facilities')
  await requireSession()

  const { total } = await loadPage(() => listFacilities({ take: 1 }))
  if (total > 0) {
    redirect('/dashboard/facilities?facilityLimit=1')
  }

  return (
    <>
      <PageHeader title={t('actions.newFacility')} />
      <FacilityForm mode="create" />
    </>
  )
}
