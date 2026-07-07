import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { BookingTable } from '@/components/BookingTable'
import { SearchInput } from '@/components/SearchInput'
import { Pagination } from '@/components/Pagination'
import { listBookings, type BookingStatus } from '@/lib/booking-api'
import { buildQuery, loadPage, requireSession } from '@/lib/dal'

const PAGE_SIZE = 20

const STATUS_FILTERS: { labelKey: string; value?: BookingStatus }[] = [
  { labelKey: 'filters.all' },
  { labelKey: 'filters.confirmed', value: 'CONFIRMED' },
  { labelKey: 'filters.checkedIn', value: 'CHECKED_IN' },
  { labelKey: 'filters.checkedOut', value: 'CHECKED_OUT' },
]

function parseStatus(value: string | undefined): BookingStatus | undefined {
  return STATUS_FILTERS.find((f) => f.value === value)?.value
}

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; skip?: string }>
}

export default async function BookingsPage({ searchParams }: PageProps) {
  await requireSession()

  const t = await getTranslations('bookings')
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
      <PageHeader title={t('title')} description={t('description')} />

      <div className="tabs">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.labelKey}
            href={buildQuery('/dashboard/bookings', { status: f.value, q })}
            className={`tab ${f.value === status ? 'tab--active' : ''}`}
          >
            {t(f.labelKey)}
          </Link>
        ))}
      </div>

      <div className="table-toolbar">
        <SearchInput placeholder={t('searchPlaceholder')} />
        <span className="text-secondary table-toolbar__count">{t('count', { count: total })}</span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t('empty.title')}
          message={q || status ? t('empty.filtered') : t('empty.default')}
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
