import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { FacilityTable } from '@/components/FacilityTable'
import { SearchInput } from '@/components/SearchInput'
import { Pagination } from '@/components/Pagination'
import { listFacilities } from '@/lib/api'
import { buildQuery, loadPage, requireSession } from '@/lib/dal'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ q?: string; skip?: string }>
}

export default async function FacilitiesPage({ searchParams }: PageProps) {
  await requireSession()

  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const skip = Math.max(0, parseInt(params.skip ?? '0', 10) || 0)

  const { items, total } = await loadPage(() =>
    listFacilities({ skip, take: PAGE_SIZE, ...(q ? { q } : {}) }),
  )

  const buildHref = (nextSkip: number) =>
    buildQuery('/dashboard/facilities', { q, skip: nextSkip })

  return (
    <>
      <PageHeader
        title="Facilities"
        actions={
          <Link href="/dashboard/facilities/new" className="btn btn--primary">
            <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
            New facility
          </Link>
        }
      />

      <div className="table-toolbar">
        <SearchInput placeholder="Search facilities…" />
        <span className="text-secondary table-toolbar__count">
          {total} {total === 1 ? 'facility' : 'facilities'}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No facilities yet"
          message={q ? 'No facilities match your search.' : 'Create your first facility to get started.'}
        />
      ) : (
        <>
          <FacilityTable items={items} />
          <Pagination skip={skip} take={PAGE_SIZE} total={total} buildHref={buildHref} />
        </>
      )}
    </>
  )
}
