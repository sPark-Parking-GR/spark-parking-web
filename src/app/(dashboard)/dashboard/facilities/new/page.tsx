import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { FacilityForm } from '@/components/FacilityForm'
import { getSession } from '@/lib/session'

export default async function NewFacilityPage() {
  const t = await getTranslations('facilities')
  const session = await getSession()
  if (!session.accessToken) redirect('/login')

  const isPlatformAdmin = session.user?.role === 'platform_admin'

  return (
    <>
      <PageHeader title={t('actions.newFacility')} />
      <FacilityForm mode="create" isPlatformAdmin={isPlatformAdmin} />
    </>
  )
}
