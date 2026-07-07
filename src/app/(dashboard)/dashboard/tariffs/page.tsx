import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { TariffPlanTable } from '@/components/TariffPlanTable'
import { SearchInput } from '@/components/SearchInput'
import { Pagination } from '@/components/Pagination'
import { listTariffPlans } from '@/lib/tariff-api'
import { buildQuery, loadPage, requireSession } from '@/lib/dal'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ q?: string; skip?: string }>
}

export default async function TariffsPage({ searchParams }: PageProps) {
  await requireSession()

  const t = await getTranslations('tariffs')
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const skip = Math.max(0, parseInt(params.skip ?? '0', 10) || 0)

  const { items: allItems } = await loadPage(() => listTariffPlans())

  const filtered = q
    ? allItems.filter((item) => item.name.toLowerCase().includes(q.toLowerCase()))
    : allItems
  const total = filtered.length
  const items = filtered.slice(skip, skip + PAGE_SIZE)

  const buildHref = (nextSkip: number) =>
    buildQuery('/dashboard/tariffs', { q: q || undefined, skip: nextSkip })

  return (
    <>
      <PageHeader
        title={t('list.title')}
        description={t('list.description')}
        actions={
          <Link href="/dashboard/tariffs/new" className="btn btn--primary">
            <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
            {t('list.newPlan')}
          </Link>
        }
      />

      <div className="table-toolbar">
        <SearchInput placeholder={t('list.searchPlaceholder')} />
      </div>
      <div className="table-toolbar table-toolbar--count">
        <span className="text-secondary table-toolbar__count">{t('list.count', { count: total })}</span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t('list.empty.title')}
          message={q ? t('list.empty.filtered') : t('list.empty.default')}
        />
      ) : (
        <>
          <TariffPlanTable items={items} />
          <Pagination skip={skip} take={PAGE_SIZE} total={total} buildHref={buildHref} sticky />
        </>
      )}
    </>
  )
}
