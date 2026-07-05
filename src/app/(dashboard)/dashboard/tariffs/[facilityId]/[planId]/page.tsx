import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { TariffEditor } from '@/components/TariffEditor'
import { DeleteTariffButton } from '@/components/DeleteTariffButton'
import { getTariffPlan } from '@/lib/tariff-api'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { getSession } from '@/lib/session'

interface PageProps {
  params: Promise<{ facilityId: string; planId: string }>
}

export default async function EditTariffPlanPage({ params }: PageProps) {
  const session = await getSession()
  if (!session.accessToken) redirect('/login')

  const { facilityId, planId } = await params

  let detail
  try {
    detail = await getTariffPlan(facilityId, planId)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound()
    throw err
  }

  return (
    <>
      <PageHeader
        title={detail.name}
        titleAccessory={<DeleteTariffButton facilityId={facilityId} planId={planId} />}
      />
      <TariffEditor mode="edit" facilityId={facilityId} planId={planId} plan={detail} />
    </>
  )
}
