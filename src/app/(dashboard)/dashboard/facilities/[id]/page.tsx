import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { FacilityForm } from '@/components/FacilityForm'
import { DeleteFacilityButton } from '@/components/DeleteFacilityButton'
import { getFacilityForEdit, ApiError, AuthRequiredError } from '@/lib/api'
import { getSession } from '@/lib/session'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditFacilityPage({ params }: PageProps) {
  const session = await getSession()
  if (!session.accessToken) redirect('/login')

  const { id } = await params

  let facility
  try {
    facility = await getFacilityForEdit(id)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound()
    throw err
  }

  const isPlatformAdmin = session.user?.role === 'platform_admin'

  return (
    <>
      <PageHeader
        title={facility.name}
        titleAccessory={<DeleteFacilityButton id={id} />}
      />
      <FacilityForm mode="edit" facility={facility} isPlatformAdmin={isPlatformAdmin} />
    </>
  )
}
