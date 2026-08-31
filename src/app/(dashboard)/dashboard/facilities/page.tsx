import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { FacilityCardGrid } from '@/components/FacilityCardGrid'
import { FacilityFilters } from '@/components/FacilityFilters'
import { ViewToggle } from '@/components/ViewToggle'
import { FacilityMapView } from '@/components/FacilityMapView'
import { SearchInput } from '@/components/SearchInput'
import { Pagination } from '@/components/Pagination'
import { listFacilities } from '@/lib/api'
import { hasHeadroomFor } from '@/lib/plan-headroom'
import type { FacilityKind } from '@/lib/api'
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
    facilityLimit?: string
  }>
}

export default async function FacilitiesPage({ searchParams }: PageProps) {
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

  const canCreateFacility = await hasHeadroomFor('facilities')

  const header = (
    <PageHeader
      title={t('list.title')}
      actions={
        canCreateFacility ? (
          <Link href="/dashboard/facilities/new" className="btn btn--primary">
            <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
            {t('actions.newFacility')}
          </Link>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            disabled
            aria-disabled="true"
            data-tooltip={t('list.facilityLimitReached')}
            data-tooltip-pos="bottom"
          >
            <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
            {t('actions.newFacility')}
          </button>
        )
      }
    />
  )

  const limitBanner =
    params.facilityLimit === '1' ? (
      <p className="form-banner form-banner--warning" role="alert">
        <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
        <span className="form-banner__body">
          <span>{t('list.facilityLimitReached')}</span>
          <Link href="/dashboard/billing" className="btn btn--sm btn--secondary">
            {t('actions.upgradePlan')}
          </Link>
        </span>
      </p>
    ) : null

  if (isMap) {
    return (
      <>
        {header}
        {limitBanner}
        {toolbar}
        <FacilityMapView
          filters={{ q: q || undefined, isActive, isPublished, kind }}
          role={session.user.role}
        />
      </>
    )
  }

  const { items, total } = await loadPage(() =>
    listFacilities({
      skip,
      take: PAGE_SIZE,
      ...(q ? { q } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(isPublished !== undefined ? { isPublished } : {}),
      ...(kind ? { kind } : {}),
    }),
  )

  const buildHref = (nextSkip: number) =>
    buildQuery('/dashboard/facilities', { ...filterParams, skip: nextSkip })

  const hasFilters = Boolean(q || isActive !== undefined || isPublished !== undefined || kind)

  return (
    <>
      {header}
      {limitBanner}
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
          <FacilityCardGrid items={items} role={session.user.role} />
          <Pagination skip={skip} take={PAGE_SIZE} total={total} buildHref={buildHref} sticky />
        </>
      )}
    </>
  )
}
