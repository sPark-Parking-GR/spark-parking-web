import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { DriverPlanEditor } from '@/components/DriverPlanEditor'
import { emptyDriverPlanDraft } from '@/lib/driver-plan-types'
import { requireSession } from '@/lib/dal'

export default async function AdminNewDriverPlanPage() {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'platform:billing.manage')) {
    redirect('/dashboard')
  }

  const t = await getTranslations('driverPlans')

  return (
    <>
      <PageHeader title={t('new.pageTitle')} description={t('new.description')} />
      <DriverPlanEditor mode="create" plan={emptyDriverPlanDraft(t('new.defaultName'))} />
    </>
  )
}
