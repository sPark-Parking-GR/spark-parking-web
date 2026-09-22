import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { DriverPlanTable } from '@/components/DriverPlanTable'
import { listDriverPlans } from '@/lib/driver-plan-api'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { requireSession } from '@/lib/dal'
import type { DriverPlan } from '@/lib/driver-plan-types'

const DRIVER_PLANS_PATH = '/admin/driver-plans'

export default async function AdminDriverPlansPage() {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'platform:billing.manage')) {
    redirect('/dashboard')
  }

  const t = await getTranslations('driverPlans')

  // Not routed through loadPage: its failure fallback is a paged `{ items }` envelope, and
  // this endpoint answers with a bare array — an empty catalog and a failed request must
  // not render as the same page.
  let items: DriverPlan[]
  try {
    items = await listDriverPlans({ includeArchived: true })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
    throw err
  }

  return (
    <>
      <PageHeader
        title={t('list.title')}
        description={t('list.description')}
        actions={
          <Link href={`${DRIVER_PLANS_PATH}/new`} className="btn btn--primary">
            <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
            {t('list.newPlan')}
          </Link>
        }
      />

      <div className="table-toolbar table-toolbar--count">
        <span className="text-secondary table-toolbar__count">
          {t('list.count', { count: items.length })}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState title={t('list.empty.title')} message={t('list.empty.default')} />
      ) : (
        <DriverPlanTable items={items} basePath={DRIVER_PLANS_PATH} />
      )}
    </>
  )
}
