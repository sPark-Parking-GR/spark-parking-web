import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { FacilityTable } from '@/components/FacilityTable'
import { listFacilities, ApiError, AuthRequiredError } from '@/lib/api'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ q?: string; skip?: string }>
}

export default async function FacilitiesPage({ searchParams }: PageProps) {
  const session = await getSession()
  if (!session.accessToken) redirect('/login')

  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const skip = Math.max(0, parseInt(params.skip ?? '0', 10) || 0)

  let data
  try {
    data = await listFacilities({ skip, take: PAGE_SIZE, ...(q ? { q } : {}) })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  const { items, total } = data
  const hasPrev = skip > 0
  const hasNext = skip + PAGE_SIZE < total
  const prevSkip = Math.max(0, skip - PAGE_SIZE)
  const nextSkip = skip + PAGE_SIZE

  function buildHref(newSkip: number) {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (newSkip > 0) p.set('skip', String(newSkip))
    const qs = p.toString()
    return `/dashboard/facilities${qs ? `?${qs}` : ''}`
  }

  return (
    <>
      <PageHeader
        title="Facilities"
        actions={
          <Link href="/dashboard/facilities/new" className="btn btn--primary">
            New facility
          </Link>
        }
      />

      <div className="table-toolbar">
        <form method="GET" action="/dashboard/facilities" className="table-search">
          <input
            className="input table-search__input"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search facilities…"
          />
          <button type="submit" className="btn btn--secondary">
            Search
          </button>
        </form>
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
          <div className="pagination">
            {hasPrev ? (
              <Link href={buildHref(prevSkip)} className="btn btn--secondary pagination__btn">
                Previous
              </Link>
            ) : (
              <span className="btn btn--secondary pagination__btn pagination__btn--disabled" aria-disabled="true">
                Previous
              </span>
            )}
            <span className="pagination__info text-secondary">
              {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
            </span>
            {hasNext ? (
              <Link href={buildHref(nextSkip)} className="btn btn--secondary pagination__btn">
                Next
              </Link>
            ) : (
              <span className="btn btn--secondary pagination__btn pagination__btn--disabled" aria-disabled="true">
                Next
              </span>
            )}
          </div>
        </>
      )}
    </>
  )
}
