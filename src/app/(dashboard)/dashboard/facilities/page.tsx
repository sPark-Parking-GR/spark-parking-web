import Link from 'next/link'
import { Plus } from 'lucide-react'
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
    verified?: string
    kind?: string
    view?: string
  }>
}

export default async function FacilitiesPage({ searchParams }: PageProps) {
  await requireSession()

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
        <SearchInput placeholder="Search facilities…" />
        <ViewToggle />
      </div>
      <div className="table-toolbar table-toolbar--filters">
        <FacilityFilters />
      </div>
    </>
  )

  const header = (
    <PageHeader
      title="Facilities"
      actions={
        <Link href="/dashboard/facilities/new" className="btn btn--primary">
          <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
          New facility
        </Link>
      }
    />
  )

  if (isMap) {
    return (
      <>
        {header}
        {toolbar}
        <FacilityMapView filters={{ q: q || undefined, isActive, isVerified, kind }} />
      </>
    )
  }

  const [{ items, total }, { items: tariffPlans }] = await Promise.all([
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
    listTariffPlans(),
  ])

  const buildHref = (nextSkip: number) =>
    buildQuery('/dashboard/facilities', { ...filterParams, skip: nextSkip })

  const hasFilters = Boolean(q || isActive !== undefined || isVerified !== undefined || kind)

  return (
    <>
      {header}
      {toolbar}
      <div className="table-toolbar table-toolbar--count">
        <span className="text-secondary table-toolbar__count">
          {total} {total === 1 ? 'facility' : 'facilities'}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No facilities found"
          message={
            hasFilters
              ? 'No facilities match your search or filters.'
              : 'Create your first facility to get started.'
          }
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
