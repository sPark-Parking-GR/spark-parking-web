import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { TariffEditor } from '@/components/TariffEditor'
import { DeleteTariffButton } from '@/components/DeleteTariffButton'
import { getTariffPlan } from '@/lib/tariff-api'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { getSession } from '@/lib/session'

interface PageProps {
  params: Promise<{ planId: string }>
  searchParams: Promise<{ facilityId?: string }>
}

export default async function EditTariffPlanPage({ params, searchParams }: PageProps) {
  const session = await getSession()
  if (!session.accessToken) redirect('/login')

  const { planId } = await params
  const { facilityId } = await searchParams
  if (!facilityId) redirect('/dashboard/tariffs')

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
        actions={<DeleteTariffButton facilityId={facilityId} planId={planId} />}
      />
      <TariffEditor mode="edit" facilityId={facilityId} planId={planId} plan={detail} />
    </>
  )
}
