import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { BookingTable } from '@/components/BookingTable'
import { BookingFacilityFilter } from '@/components/BookingFacilityFilter'
import { SearchInput } from '@/components/SearchInput'
import { Pagination } from '@/components/Pagination'
import { listFacilities } from '@/lib/api'
import { listBookings } from '@/lib/booking-api'
import { BOOKING_STATUS_FILTERS, parseBookingStatus } from '@/lib/booking-format'
import { buildQuery, loadPage, requireSession } from '@/lib/dal'

const BOOKINGS_PATH = '/admin/bookings'

const PAGE_SIZE = 20

// Only BUSINESS facilities are bookable, so the picker never has to page through the
// ingested public-parking catalog, and the one-facility-per-operator cap keeps the
// remainder inside the API's 100-row ceiling.
const FACILITY_OPTIONS_LIMIT = 100

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; facilityId?: string; skip?: string }>
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  await requireSession()

  const t = await getTranslations('bookings')
  const params = await searchParams
  const status = parseBookingStatus(params.status)
  const q = params.q?.trim() ?? ''
  const facilityId = params.facilityId?.trim() ?? ''
  const skip = Math.max(0, parseInt(params.skip ?? '0', 10) || 0)

  const [{ items, total }, facilityPage] = await Promise.all([
    loadPage(() =>
      listBookings({
        skip,
        take: PAGE_SIZE,
        ...(status ? { status } : {}),
        ...(q ? { q } : {}),
        ...(facilityId ? { facilityId } : {}),
      }),
    ),
    loadPage(() => listFacilities({ take: FACILITY_OPTIONS_LIMIT, kind: 'BUSINESS' })),
  ])

  const facilities = facilityPage.items
    .map((f) => ({ id: f.id, name: f.name, operatorName: f.operatorName }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const buildHref = (nextSkip: number) =>
    buildQuery(BOOKINGS_PATH, { status, q, facilityId, skip: nextSkip })

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="tabs">
        {BOOKING_STATUS_FILTERS.map((f) => (
          <Link
            key={f.labelKey}
            href={buildQuery(BOOKINGS_PATH, { status: f.value, q, facilityId })}
            className={`tab ${f.value === status ? 'tab--active' : ''}`}
          >
            {t(f.labelKey)}
          </Link>
        ))}
      </div>

      <div className="table-toolbar">
        <SearchInput placeholder={t('searchPlaceholder')} />
        <BookingFacilityFilter facilities={facilities} />
        <span className="text-secondary table-toolbar__count">{t('count', { count: total })}</span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t('empty.title')}
          message={q || status || facilityId ? t('empty.filtered') : t('empty.default')}
        />
      ) : (
        <>
          <BookingTable items={items} basePath={BOOKINGS_PATH} />
          <Pagination skip={skip} take={PAGE_SIZE} total={total} buildHref={buildHref} />
        </>
      )}
    </>
  )
}
