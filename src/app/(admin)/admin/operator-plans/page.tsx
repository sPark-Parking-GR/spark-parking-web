import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { OperatorPlanTable } from '@/components/OperatorPlanTable'
import { listOperatorPlans } from '@/lib/operator-plan-api'
import { loadPage, requireSession } from '@/lib/dal'

const OPERATOR_PLANS_PATH = '/admin/operator-plans'

export default async function AdminOperatorPlansPage() {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'platform:billing.manage')) {
    redirect('/dashboard')
  }

  const t = await getTranslations('operatorPlans')

  const { items } = await loadPage(async () => ({
    items: await listOperatorPlans({ includeArchived: true }),
  }))

  return (
    <>
      <PageHeader
        title={t('list.title')}
        description={t('list.description')}
        actions={
          <Link href={`${OPERATOR_PLANS_PATH}/new`} className="btn btn--primary">
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
        <OperatorPlanTable items={items} basePath={OPERATOR_PLANS_PATH} />
      )}
    </>
  )
}
