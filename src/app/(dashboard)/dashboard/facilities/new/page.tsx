import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { FacilityForm } from '@/components/FacilityForm'
import { getSession } from '@/lib/session'

export default async function NewFacilityPage() {
  const session = await getSession()
  if (!session.accessToken) redirect('/login')

  const isPlatformAdmin = session.user?.role === 'platform_admin'

  return (
    <>
      <PageHeader title="New facility" />
      <FacilityForm mode="create" isPlatformAdmin={isPlatformAdmin} />
    </>
  )
}
