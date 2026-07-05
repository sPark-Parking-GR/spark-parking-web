import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { TariffFacilityTable } from '@/components/TariffFacilityTable'
import { FacilityFilters } from '@/components/FacilityFilters'
import { SearchInput } from '@/components/SearchInput'
import { Pagination } from '@/components/Pagination'
import { listFacilities } from '@/lib/api'
import type { FacilityKind } from '@/lib/api'
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
  }>
}

export default async function TariffsPage({ searchParams }: PageProps) {
  await requireSession()

  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const skip = Math.max(0, parseInt(params.skip ?? '0', 10) || 0)

  const isActive =
    params.status === 'active' ? true : params.status === 'inactive' ? false : undefined
  const isVerified =
    params.verified === 'verified' ? true : params.verified === 'pending' ? false : undefined
  const kind = KINDS.includes(params.kind as FacilityKind)
    ? (params.kind as FacilityKind)
    : undefined

  const filterParams = { q: q || undefined, status: params.status, verified: params.verified, kind }

  const { items, total } = await loadPage(() =>
    listFacilities({
      skip,
      take: PAGE_SIZE,
      ...(q ? { q } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(isVerified !== undefined ? { isVerified } : {}),
      ...(kind ? { kind } : {}),
    }),
  )

  const buildHref = (nextSkip: number) =>
    buildQuery('/dashboard/tariffs', { ...filterParams, skip: nextSkip })

  const hasFilters = Boolean(q || isActive !== undefined || isVerified !== undefined || kind)

  return (
    <>
      <PageHeader title="Tariffs" description="Pick a facility to view and edit its pricing plans." />

      <div className="table-toolbar">
        <SearchInput placeholder="Search facilities…" />
      </div>
      <div className="table-toolbar table-toolbar--filters">
        <FacilityFilters />
      </div>
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
              : 'Create a facility first to configure its tariffs.'
          }
        />
      ) : (
        <>
          <TariffFacilityTable items={items} />
          <Pagination skip={skip} take={PAGE_SIZE} total={total} buildHref={buildHref} sticky />
        </>
      )}
    </>
  )
}
