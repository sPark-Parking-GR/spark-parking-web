// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../../messages/en.json'
import type { BookingListItem } from '@/lib/booking-api'

const refresh = vi.hoisted(() => vi.fn())
const push = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push }) }))

import { KpiCard } from './KpiCard'
import { PeriodControl } from './PeriodControl'
import { RecentBookings } from './RecentBookings'
import { RevenueAreaChart } from './RevenueAreaChart'
import { SectionBoundary } from './SectionBoundary'
import { SectionError } from './SectionError'
import { KpiSkeleton } from './Skeletons'

function renderIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

const baseKpi = {
  label: 'Revenue',
  hint: 'Net revenue',
  icon: <span />,
  tone: 'amber',
  index: 0,
} as const

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi
      .fn()
      .mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  )
})

afterEach(() => {
  cleanup()
  refresh.mockReset()
  push.mockReset()
  vi.unstubAllGlobals()
})

describe('KpiCard', () => {
  it('renders the loading skeleton as hidden placeholder', () => {
    const { container } = render(<KpiSkeleton index={1} />)
    const card = container.querySelector('.ov-kpi')
    expect(card).toHaveAttribute('data-state', 'loading')
    expect(card).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders formatted data', () => {
    renderIntl(<KpiCard {...baseKpi} data={{ kind: 'currency', cents: 123456, currency: 'EUR' }} />)
    expect(screen.getByText('€1,234.56')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Net revenue' })).toHaveAttribute(
      'data-tooltip',
      'Net revenue',
    )
  })

  it('renders zero and percentages with a bar', () => {
    const { container } = renderIntl(
      <KpiCard {...baseKpi} showBar data={{ kind: 'percent', ratio: 0 }} />,
    )
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(container.querySelector('.ov-kpi__bar')).toBeInTheDocument()
  })

  it('renders the error state with a dash and message', () => {
    const { container } = renderIntl(<KpiCard {...baseKpi} errorLabel="Couldn’t load" />)
    expect(container.querySelector('.ov-kpi')).toHaveAttribute('data-state', 'error')
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Couldn’t load')).toBeInTheDocument()
  })

  it('links the whole card when an href is given', () => {
    renderIntl(
      <KpiCard {...baseKpi} href="/dashboard/tariffs" data={{ kind: 'number', value: 3 }} />,
    )
    expect(screen.getByRole('link', { name: 'Revenue' })).toHaveAttribute(
      'href',
      '/dashboard/tariffs',
    )
  })
})

const booking = (over: Partial<BookingListItem>): BookingListItem => ({
  id: 'b1',
  accessCode: 'ABCD1234',
  status: 'CHECKED_IN',
  startsAt: '2026-11-16T10:00:00.000Z',
  endsAt: '2026-11-16T12:00:00.000Z',
  vehiclePlate: 'IKA-4821',
  vehicleType: 'CAR',
  quotedPriceCents: 1250,
  finalPriceCents: null,
  currency: 'EUR',
  facility: { id: 'f1', name: 'Syntagma Garage' },
  createdAt: '2026-11-16T09:00:00.000Z',
  ...over,
})

describe('RecentBookings', () => {
  it('renders both the table and the card list; CSS containers choose which shows', () => {
    const { container } = renderIntl(
      <RecentBookings
        basePath="/dashboard/bookings"
        items={[booking({}), booking({ id: 'b2', status: 'CANCELLED' })]}
      />,
    )
    const table = container.querySelector('table.ov-tbl')
    const list = container.querySelector('ul.ov-blist')
    expect(table).toHaveAttribute('data-view', 'table')
    expect(list).toHaveAttribute('data-view', 'list')
    expect(within(table as HTMLElement).getAllByRole('row')).toHaveLength(3)
    expect(within(list as HTMLElement).getAllByRole('listitem')).toHaveLength(2)
    expect(container.querySelector('.ov-col-vehicle')).toBeInTheDocument()
    expect(within(table as HTMLElement).getByText('Active')).toBeInTheDocument()
    expect(within(list as HTMLElement).getByText('Cancelled')).toBeInTheDocument()
    expect(within(table as HTMLElement).getAllByRole('link')[0]).toHaveAttribute(
      'href',
      '/dashboard/bookings/b1',
    )
  })
})

describe('section errors', () => {
  it('retry refetches via router.refresh', async () => {
    const user = userEvent.setup()
    renderIntl(<SectionError />)
    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t load this data')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('hides retry when the error cannot be retried', () => {
    renderIntl(<SectionError message="Narrow the date range" retryable={false} />)
    expect(screen.getByText('Narrow the date range')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('boundary contains a thrown section error and retries', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function Boom(): ReactElement {
      throw new Error('boom')
    }
    renderIntl(
      <SectionBoundary>
        <Boom />
      </SectionBoundary>,
    )
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refresh).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })
})

describe('RevenueAreaChart', () => {
  const points = [
    {
      bucketStart: '2026-11-14T00:00:00.000Z',
      grossRevenueCents: 0,
      refundedCents: 0,
      netRevenueCents: 1000,
      bookingCount: 1,
    },
    {
      bucketStart: '2026-11-15T00:00:00.000Z',
      grossRevenueCents: 0,
      refundedCents: 0,
      netRevenueCents: 3000,
      bookingCount: 2,
    },
  ]

  it('toggles between chart and newest-first table', async () => {
    const user = userEvent.setup()
    renderIntl(<RevenueAreaChart points={points} currency="EUR" bucket="day" />)
    expect(screen.getByRole('img', { name: 'Revenue by period' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chart' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Table' }))
    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('15 Nov')
    expect(rows[1]).toHaveTextContent('€30.00')
  })

  it('shows the empty state with disabled toggle when there is no revenue', () => {
    renderIntl(
      <RevenueAreaChart
        points={points.map((p) => ({ ...p, netRevenueCents: 0 }))}
        currency="EUR"
        bucket="day"
      />,
    )
    expect(screen.getByText('No confirmed revenue yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Table' })).toBeDisabled()
  })
})

describe('PeriodControl', () => {
  const hrefs = {
    '7d': '/dashboard?range=7d',
    '30d': '/dashboard',
    '90d': '/dashboard?range=90d',
    '12m': '/dashboard?range=12m',
  }

  it('marks the active preset and navigates on selection', async () => {
    const user = userEvent.setup()
    renderIntl(<PeriodControl active="30d" hrefs={hrefs} showPeriods />)
    expect(screen.getByRole('button', { name: '30 days' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: '90 days' }))
    expect(push).toHaveBeenCalledWith('/dashboard?range=90d')
  })

  it('refresh button calls router.refresh', async () => {
    const user = userEvent.setup()
    renderIntl(<PeriodControl active="30d" hrefs={hrefs} showPeriods={false} />)
    expect(screen.queryByRole('group', { name: 'Date range' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
