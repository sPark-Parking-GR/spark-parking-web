import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { DriverPlanEditor } from '@/components/DriverPlanEditor'
import { ArchivePlanButton } from '@/components/driver-plans/ArchivePlanButton'
import { getDriverPlan } from '@/lib/driver-plan-api'
import { toDriverPlanDraft } from '@/lib/driver-plan-types'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { requireSession } from '@/lib/dal'
import type { DriverPlan } from '@/lib/driver-plan-types'

interface PageProps {
  params: Promise<{ planId: string }>
}

export default async function AdminEditDriverPlanPage({ params }: PageProps) {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'platform:billing.manage')) {
    redirect('/dashboard')
  }

  const { planId } = await params
  const t = await getTranslations('driverPlans')

  let plan: DriverPlan | undefined
  try {
    plan = await getDriverPlan(planId)
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
              iconOnly
            />
          ) : undefined
        }
      />
      {plan.lifecycleStatus === 'ACTIVE' ? null : (
        <p className="form-banner form-banner--warning" role="status">
          {t('detail.archivedNotice')}
        </p>
      )}
      <DriverPlanEditor mode="edit" planId={plan.id} plan={toDriverPlanDraft(plan)} />
    </>
  )
}
