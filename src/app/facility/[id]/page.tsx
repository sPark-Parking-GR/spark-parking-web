import { AppBar, Badge, Button, Card, Container } from '../../../components/ui'
import { getFacility, getQuote, type FacilityDetail, type PriceQuote } from '../../../lib/api'
import { formatMoney, formatTimeRange } from '../../../lib/format'

type DetailPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function FacilityDetailPage({ params, searchParams }: DetailPageProps) {
  const { id } = await params
  const { startsAt, endsAt, vehicleType } = await searchParams

  let facility: FacilityDetail | null = null
  let quote: PriceQuote | null = null
  let error: string | null = null

  try {
    facility = await getFacility(id)
    if (startsAt && endsAt && vehicleType) {
      quote = await getQuote(id, startsAt, endsAt, vehicleType).catch(() => null)
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Δεν βρέθηκε ο χώρος'
  }

  if (error || !facility) {
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

  const checkoutQuery = new URLSearchParams({
    facilityId: facility.id,
    name: facility.name,
    ...(startsAt ? { startsAt } : {}),
    ...(endsAt ? { endsAt } : {}),
    ...(vehicleType ? { vehicleType } : {}),
  }).toString()

  return (
    <>
      <AppBar />
      <Container style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{facility.name}</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 8 }}>{facility.address}</p>
        {facility.rating.average != null ? (
          <p style={{ fontSize: 14, marginBottom: 16 }}>
            ★ {facility.rating.average.toFixed(1)} ({facility.rating.count})
          </p>
        ) : null}

        <Card style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 12 }}>Παροχές</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {facility.amenities.map((a) => (
              <Badge key={a} variant="neutral">
                {a}
              </Badge>
            ))}
            {facility.heightRestrictionCm ? (
              <Badge variant="warning">Ύψος ≤ {facility.heightRestrictionCm}cm</Badge>
            ) : null}
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 0, marginTop: 12 }}>
            {facility.cancellationPolicy}
          </p>
        </Card>

        {quote ? (
          <Card style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 8 }}>Τιμή</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 0 }}>
              {formatTimeRange(quote.startsAt, quote.endsAt)}
            </p>
            {quote.lineItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                <span>
                  {item.label} × {item.quantity}
                </span>
                <span>{formatMoney(item.subtotalCents, quote!.currency)}</span>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: 18,
                borderTop: '1px solid var(--color-border)',
                marginTop: 8,
                paddingTop: 8,
                color: 'var(--color-primary)',
              }}
            >
              <span>Σύνολο</span>
              <span>{formatMoney(quote.totalCents, quote.currency)}</span>
            </div>
          </Card>
        ) : (
          <Card style={{ marginBottom: 16 }}>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              Επίλεξε ώρα άφιξης και αναχώρησης για τιμή.
            </p>
          </Card>
        )}

        {quote ? (
          <a href={`/checkout?${checkoutQuery}`} style={{ textDecoration: 'none' }}>
            <Button fullWidth>Κράτηση</Button>
          </a>
        ) : null}
      </Container>
    </>
  )
}
