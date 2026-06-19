import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { BookingTable } from '@/components/BookingTable'
import { listBookings, type BookingStatus } from '@/lib/booking-api'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { getSession } from '@/lib/session'

const PAGE_SIZE = 20

const STATUS_FILTERS: { label: string; value?: BookingStatus }[] = [
  { label: 'All' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Checked in', value: 'CHECKED_IN' },
  { label: 'Checked out', value: 'CHECKED_OUT' },
]

function parseStatus(value: string | undefined): BookingStatus | undefined {
  const match = STATUS_FILTERS.find((f) => f.value === value)
  return match?.value
}

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; skip?: string }>
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const session = await getSession()
  if (!session.accessToken) redirect('/login')

  const params = await searchParams
  const status = parseStatus(params.status)
  const q = params.q?.trim() ?? ''
  const skip = Math.max(0, parseInt(params.skip ?? '0', 10) || 0)

  let data
  try {
    data = await listBookings({
      skip,
      take: PAGE_SIZE,
      ...(status ? { status } : {}),
      ...(q ? { q } : {}),
    })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/dashboard')
    throw err
  }

  const { items, total } = data
  const hasPrev = skip > 0
  const hasNext = skip + PAGE_SIZE < total
  const prevSkip = Math.max(0, skip - PAGE_SIZE)
  const nextSkip = skip + PAGE_SIZE

  function buildHref(over: { status?: BookingStatus; q?: string; skip?: number }) {
    const p = new URLSearchParams()
    const nextStatus = 'status' in over ? over.status : status
    const nextQ = 'q' in over ? over.q : q
    const nextSkipVal = over.skip ?? 0
    if (nextStatus) p.set('status', nextStatus)
    if (nextQ) p.set('q', nextQ)
    if (nextSkipVal > 0) p.set('skip', String(nextSkipVal))
    const qs = p.toString()
    return `/dashboard/bookings${qs ? `?${qs}` : ''}`
  }

  return (
    <>
      <PageHeader title="Bookings" description="Track reservations and run check-in / check-out." />

      <div className="tabs">
        {STATUS_FILTERS.map((f) => {
          const active = f.value === status
          return (
            <Link
              key={f.label}
              href={buildHref({ status: f.value, skip: 0 })}
              className={`tab ${active ? 'tab--active' : ''}`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <div className="table-toolbar">
        <form method="GET" action="/dashboard/bookings" className="table-search">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <input
            className="input table-search__input"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search access code or plate…"
          />
          <button type="submit" className="btn btn--secondary">
            Search
          </button>
        </form>
        <span className="text-secondary table-toolbar__count">
          {total} {total === 1 ? 'booking' : 'bookings'}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No bookings"
          message={q || status ? 'No bookings match these filters.' : 'Bookings will appear here as they come in.'}
        />
      ) : (
        <>
          <BookingTable items={items} />
          <div className="pagination">
            {hasPrev ? (
              <Link href={buildHref({ skip: prevSkip })} className="btn btn--secondary pagination__btn">
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
              <Link href={buildHref({ skip: nextSkip })} className="btn btn--secondary pagination__btn">
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
