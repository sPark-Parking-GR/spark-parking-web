import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { OperatorPlanEditor } from '@/components/OperatorPlanEditor'
import { requireSession } from '@/lib/dal'
import type { OperatorPlanDraft } from '@/lib/operator-plan-api'

function buildDefaultDraft(): OperatorPlanDraft {
  return {
    code: '',
    name: '',
    description: '',
    priceCents: 0,
    currency: 'EUR',
    interval: 'MONTHLY',
    entitlements: {
      maxFacilities: 1,
      maxTariffPlans: 1,
      maxStaffSeats: 1,
      features: [],
      commissionBps: 0,
    },
    isPublic: true,
    sortOrder: 0,
  }
}

export default async function AdminNewOperatorPlanPage() {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'platform:billing.manage')) {
    redirect('/dashboard')
  }

  const t = await getTranslations('operatorPlans')

  return (
    <>
      <PageHeader title={t('new.pageTitle')} description={t('new.description')} />
      <OperatorPlanEditor mode="create" plan={buildDefaultDraft()} />
    </>
  )
}
