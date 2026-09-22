import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { FacilitiesManager } from '@/components/FacilitiesManager'
import { FacilityFilters } from '@/components/FacilityFilters'
import { ViewToggle } from '@/components/ViewToggle'
import { FacilityMapView } from '@/components/FacilityMapView'
import { SearchInput } from '@/components/SearchInput'
import { Pagination } from '@/components/Pagination'
import { listFacilities } from '@/lib/api'
import type { FacilityKind } from '@/lib/api'
import { listTariffPlans } from '@/lib/tariff-api'
import { buildQuery, loadPage, requireSession } from '@/lib/dal'

const PAGE_SIZE = 20

const KINDS: FacilityKind[] = ['BUSINESS', 'FREE_PUBLIC', 'RESTRICTED', 'UNKNOWN']

interface PageProps {
  searchParams: Promise<{
    q?: string
    skip?: string
    status?: string
    published?: string
    kind?: string
    view?: string
  }>
}

export default async function AdminFacilitiesPage({ searchParams }: PageProps) {
  const t = await getTranslations('facilities')
  const session = await requireSession()

  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const skip = Math.max(0, parseInt(params.skip ?? '0', 10) || 0)
  const isMap = params.view === 'map'

  const isActive =
    params.status === 'active' ? true : params.status === 'inactive' ? false : undefined
  const isPublished =
    params.published === 'published' ? true : params.published === 'unpublished' ? false : undefined
  const kind = KINDS.includes(params.kind as FacilityKind)
    ? (params.kind as FacilityKind)
    : undefined

  const filterParams = {
    q: q || undefined,
    status: params.status,
    published: params.published,
    kind,
    view: params.view,
  }

  const toolbar = (
    <>
      <div className="table-toolbar">
        <SearchInput placeholder={t('list.searchPlaceholder')} />
        <ViewToggle />
      </div>
      <div className="table-toolbar table-toolbar--filters">
        <FacilityFilters />
      </div>
    </>
  )

  // The one-facility-per-operator cap is an operator-scoped rule; a platform admin picks
  // the owning operator explicitly, so creation is never gated here.
  const header = (
    <PageHeader
      title={t('list.title')}
      actions={
        <Link href="/admin/facilities/new" className="btn btn--primary">
          <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
          {t('actions.newFacility')}
        </Link>
      }
    />
  )

  if (isMap) {
    return (
      <>
        {header}
        {toolbar}
        <FacilityMapView
          filters={{ q: q || undefined, isActive, isPublished, kind }}
          role={session.user.role}
        />
      </>
    )
  }

  const [{ items, total }, tariffPlans] = await Promise.all([
    loadPage(() =>
      listFacilities({
        skip,
        take: PAGE_SIZE,
        ...(q ? { q } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
        ...(kind ? { kind } : {}),
      }),
    ),
    listTariffPlans().then((res) => res.items),
  ])

  const buildHref = (nextSkip: number) =>
    buildQuery('/admin/facilities', { ...filterParams, skip: nextSkip })

  const hasFilters = Boolean(q || isActive !== undefined || isPublished !== undefined || kind)

  return (
    <>
      {header}
      {toolbar}
      <div className="table-toolbar table-toolbar--count">
        <span className="text-secondary table-toolbar__count">
          {t('list.count', { count: total })}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t('list.emptyTitle')}
          message={hasFilters ? t('list.emptyFiltered') : t('list.emptyDefault')}
        />
      ) : (
        <>
          <FacilitiesManager items={items} tariffPlans={tariffPlans} />
          <Pagination skip={skip} take={PAGE_SIZE} total={total} buildHref={buildHref} sticky />
        </>
      )}
    </>
  )
}
