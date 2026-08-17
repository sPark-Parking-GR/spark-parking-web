import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { TariffPlanTable } from '@/components/TariffPlanTable'
import { TariffOperatorFilter } from '@/components/TariffOperatorFilter'
import { SearchInput } from '@/components/SearchInput'
import { Pagination } from '@/components/Pagination'
import { listTariffPlans } from '@/lib/tariff-api'
import { listOperatorsAction } from '@/lib/operator-actions'
import { buildQuery, loadPage, requireSession } from '@/lib/dal'

const TARIFFS_PATH = '/admin/tariffs'
const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ q?: string; operatorId?: string; skip?: string }>
}

export default async function AdminTariffsPage({ searchParams }: PageProps) {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'platform:tenant.read')) {
    redirect('/dashboard')
  }
  const canWrite = hasPlatformPermission(session.user.role, 'platform:tenant.write')
  const canPurge = hasPlatformPermission(session.user.role, 'platform:tenant.purge')

  const t = await getTranslations('tariffs')
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const operatorId = params.operatorId?.trim() ?? ''
  const skip = Math.max(0, parseInt(params.skip ?? '0', 10) || 0)

  const [{ items: allItems }, operators] = await Promise.all([
    loadPage(() => listTariffPlans(operatorId ? { operatorId } : {})),
    listOperatorsAction(),
  ])

  const filtered = q
    ? allItems.filter((item) => item.name.toLowerCase().includes(q.toLowerCase()))
    : allItems
  const total = filtered.length
  const items = filtered.slice(skip, skip + PAGE_SIZE)

  const buildHref = (nextSkip: number) =>
    buildQuery(TARIFFS_PATH, {
      q: q || undefined,
      operatorId: operatorId || undefined,
      skip: nextSkip,
    })

  return (
    <>
      <PageHeader
        title={t('list.title')}
        description={t('list.description')}
        actions={
          <Link href={`${TARIFFS_PATH}/new`} className="btn btn--primary">
            <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
            {t('list.newPlan')}
          </Link>
        }
      />

      <div className="table-toolbar">
        <SearchInput placeholder={t('list.searchPlaceholder')} />
      </div>
      <div className="table-toolbar table-toolbar--filters">
        <TariffOperatorFilter
          operators={operators.map((operator) => ({ id: operator.id, name: operator.name }))}
        />
      </div>
      <div className="table-toolbar table-toolbar--count">
        <span className="text-secondary table-toolbar__count">
          {t('list.count', { count: total })}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t('list.empty.title')}
          message={q || operatorId ? t('list.empty.filtered') : t('list.empty.default')}
        />
      ) : (
        <>
          <TariffPlanTable
            items={items}
            basePath={TARIFFS_PATH}
            showOperator
            canWrite={canWrite}
            canPurge={canPurge}
          />
          <Pagination skip={skip} take={PAGE_SIZE} total={total} buildHref={buildHref} sticky />
        </>
      )}
    </>
  )
}
