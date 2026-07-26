import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { FacilitiesManager } from '@/components/FacilitiesManager'
import { FacilityCardGrid } from '@/components/FacilityCardGrid'
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
    verified?: string
    kind?: string
    view?: string
    facilityLimit?: string
  }>
}

export default async function FacilitiesPage({ searchParams }: PageProps) {
  const t = await getTranslations('facilities')
  const session = await requireSession()
  const isPlatformAdmin = session.user.role === 'platform_admin'

  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const skip = Math.max(0, parseInt(params.skip ?? '0', 10) || 0)
  const isMap = params.view === 'map'

  const isActive =
    params.status === 'active' ? true : params.status === 'inactive' ? false : undefined
  const isVerified =
    params.verified === 'verified' ? true : params.verified === 'pending' ? false : undefined
  const kind = KINDS.includes(params.kind as FacilityKind)
    ? (params.kind as FacilityKind)
    : undefined

  const filterParams = {
    q: q || undefined,
    status: params.status,
    verified: params.verified,
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

  // One-facility-per-operator cap: only meaningful for an operator's own view.
  // A platform_admin isn't scoped to a single operator, so the button always shows for them.
  const canCreateFacility = isPlatformAdmin || (await loadPage(() => listFacilities({ take: 1 }))).total === 0

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
        {t('list.facilityLimitReached')}
      </p>
    ) : null

  if (isMap) {
    return (
      <>
        {header}
        {limitBanner}
        {toolbar}
        <FacilityMapView filters={{ q: q || undefined, isActive, isVerified, kind }} />
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
        ...(isVerified !== undefined ? { isVerified } : {}),
        ...(kind ? { kind } : {}),
      }),
    ),
    isPlatformAdmin ? listTariffPlans().then((res) => res.items) : Promise.resolve([]),
  ])

  const buildHref = (nextSkip: number) =>
    buildQuery('/dashboard/facilities', { ...filterParams, skip: nextSkip })

  const hasFilters = Boolean(q || isActive !== undefined || isVerified !== undefined || kind)

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
          {isPlatformAdmin ? (
            <FacilitiesManager items={items} tariffPlans={tariffPlans} />
          ) : (
            <FacilityCardGrid items={items} />
          )}
          <Pagination skip={skip} take={PAGE_SIZE} total={total} buildHref={buildHref} sticky />
        </>
      )}
    </>
  )
}
