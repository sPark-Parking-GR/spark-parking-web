import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { FacilityForm } from '@/components/FacilityForm'
import { listOperatorsAction } from '@/lib/operator-actions'

export default async function AdminNewFacilityPage() {
  const t = await getTranslations('facilities')
  const operators = await listOperatorsAction()

  return (
    <>
      <PageHeader title={t('actions.newFacility')} />
      <FacilityForm mode="create" isPlatformAdmin operators={operators} />
    </>
  )
}
