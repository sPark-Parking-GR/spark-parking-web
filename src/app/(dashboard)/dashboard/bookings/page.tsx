import Link from 'next/link'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { BookingTable } from '@/components/BookingTable'
import { SearchInput } from '@/components/SearchInput'
import { Pagination } from '@/components/Pagination'
import { listBookings, type BookingStatus } from '@/lib/booking-api'
import { buildQuery, loadPage, requireSession } from '@/lib/dal'

const PAGE_SIZE = 20

const STATUS_FILTERS: { label: string; value?: BookingStatus }[] = [
  { label: 'All' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Checked in', value: 'CHECKED_IN' },
  { label: 'Checked out', value: 'CHECKED_OUT' },
]

function parseStatus(value: string | undefined): BookingStatus | undefined {
  return STATUS_FILTERS.find((f) => f.value === value)?.value
}

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; skip?: string }>
}

export default async function BookingsPage({ searchParams }: PageProps) {
  await requireSession()

  const params = await searchParams
  const status = parseStatus(params.status)
  const q = params.q?.trim() ?? ''
  const skip = Math.max(0, parseInt(params.skip ?? '0', 10) || 0)

  const { items, total } = await loadPage(
    () =>
      listBookings({
        skip,
        take: PAGE_SIZE,
        ...(status ? { status } : {}),
        ...(q ? { q } : {}),
      }),
    { redirects: { 403: '/dashboard' } },
  )

  const buildHref = (nextSkip: number) =>
    buildQuery('/dashboard/bookings', { status, q, skip: nextSkip })

  return (
    <>
      <PageHeader title="Bookings" description="Track reservations and run check-in / check-out." />

      <div className="tabs">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.label}
            href={buildQuery('/dashboard/bookings', { status: f.value, q })}
            className={`tab ${f.value === status ? 'tab--active' : ''}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="table-toolbar">
        <SearchInput placeholder="Search access code or plate…" />
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
          <Pagination skip={skip} take={PAGE_SIZE} total={total} buildHref={buildHref} />
        </>
      )}
    </>
  )
}
