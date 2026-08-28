import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { OperatorPlanEditor } from '@/components/OperatorPlanEditor'
import { ArchivePlanButton } from '@/components/ArchivePlanButton'
import { getOperatorPlan } from '@/lib/operator-plan-api'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { requireSession } from '@/lib/dal'
import type { OperatorPlanView } from '@/lib/operator-plan-api'

interface PageProps {
  params: Promise<{ planId: string }>
}

export default async function AdminEditOperatorPlanPage({ params }: PageProps) {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'platform:billing.manage')) {
    redirect('/dashboard')
  }

  const { planId } = await params
  const t = await getTranslations('operatorPlans')

  let plan: OperatorPlanView | null
  try {
    plan = await getOperatorPlan(planId)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound()
    throw err
  }

  if (!plan) notFound()

  return (
    <>
      <PageHeader
        title={plan.name}
        description={t('detail.description', { count: plan.subscribers })}
        titleAccessory={
          plan.lifecycleStatus === 'ACTIVE' ? (
            <ArchivePlanButton
              planId={plan.id}
              planName={plan.name}
              subscribers={plan.subscribers}
            />
          ) : undefined
        }
      />
      <OperatorPlanEditor
        mode="edit"
        planId={plan.id}
        plan={{
          code: plan.code,
          name: plan.name,
          description: plan.description ?? '',
          priceCents: plan.priceCents,
          currency: plan.currency,
          interval: plan.interval,
          entitlements: plan.entitlements,
          isPublic: plan.isPublic,
          sortOrder: plan.sortOrder,
        }}
      />
    </>
  )
}
