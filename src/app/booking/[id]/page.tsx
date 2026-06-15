import { AppBar, Badge, Card, Container } from '../../../components/ui'
import { getBooking, type BookingDetail } from '../../../lib/api'
import { formatMoney, formatTimeRange } from '../../../lib/format'

type TicketPageProps = {
  params: Promise<{ id: string }>
}

const STATUS_LABEL: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' | 'error' }> = {
  CONFIRMED: { label: 'Επιβεβαιωμένη', variant: 'success' },
  PENDING_PAYMENT: { label: 'Εκκρεμεί πληρωμή', variant: 'warning' },
  CHECKED_IN: { label: 'Σε εξέλιξη', variant: 'success' },
  CHECKED_OUT: { label: 'Ολοκληρωμένη', variant: 'neutral' },
  CANCELLED: { label: 'Ακυρωμένη', variant: 'error' },
  REFUNDED: { label: 'Επιστροφή χρημάτων', variant: 'neutral' },
  EXPIRED: { label: 'Έληξε', variant: 'error' },
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params

  let booking: BookingDetail | null = null
  let error: string | null = null
  try {
    booking = await getBooking(id)
  } catch (e) {
    error = e instanceof Error ? e.message : 'Δεν βρέθηκε η κράτηση'
  }

  if (error || !booking) {
    return (
      <>
        <AppBar />
        <Container style={{ paddingTop: 24 }}>
          <Card>
            <p style={{ color: 'var(--color-error)', margin: 0 }}>{error ?? 'Σφάλμα'}</p>
          </Card>
        </Container>
      </>
    )
  }

  const status = STATUS_LABEL[booking.status] ?? { label: booking.status, variant: 'neutral' as const }
  const price = booking.finalPriceCents ?? booking.quotedPriceCents

  return (
    <>
      <AppBar />
      <Container style={{ paddingTop: 24, paddingBottom: 48 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Η κράτησή σου</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          <div
            style={{
              textAlign: 'center',
              padding: '20px 0',
              borderTop: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Κωδικός εισόδου</div>
            <div className="access-code">{booking.accessCode}</div>
          </div>

          <Row label="Χώρος" value={booking.facility.name} />
          <Row label="Διεύθυνση" value={booking.facility.address} />
          <Row label="Διάστημα" value={formatTimeRange(booking.startsAt, booking.endsAt)} />
          <Row label="Πινακίδα" value={booking.vehiclePlate} />
          <Row label="Σύνολο" value={formatMoney(price, booking.currency)} />
        </Card>

        <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: 16, color: 'var(--color-primary)', textDecoration: 'none' }}>
          Νέα αναζήτηση
        </a>
      </Container>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, marginBottom: 8 }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ textAlign: 'right', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
