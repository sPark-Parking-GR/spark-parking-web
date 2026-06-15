import { FacilityCard } from '../../components/FacilityCard'
import { MapPanel } from '../../components/MapPanel'
import { AppBar, Card, Container } from '../../components/ui'
import { searchFacilities, type FacilitySearchResult } from '../../lib/api'

type SearchPageProps = {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const { lat, lng, startsAt, endsAt, vehicleType, dest } = params

  let results: FacilitySearchResult[] = []
  let error: string | null = null

  if (lat && lng && startsAt && endsAt) {
    try {
      results = await searchFacilities({
        lat: Number(lat),
        lng: Number(lng),
        startsAt,
        endsAt,
        vehicleType,
      })
    } catch (e) {
      error = e instanceof Error ? e.message : 'Η αναζήτηση απέτυχε'
    }
  } else {
    error = 'Λείπουν παράμετροι αναζήτησης'
  }

  const detailQuery = new URLSearchParams({
    ...(startsAt ? { startsAt } : {}),
    ...(endsAt ? { endsAt } : {}),
    ...(vehicleType ? { vehicleType } : {}),
  }).toString()

  return (
    <>
      <AppBar />
      <Container style={{ paddingTop: 24, paddingBottom: 48 }}>
        <a href="/" style={{ fontSize: 13, color: 'var(--color-primary)', textDecoration: 'none' }}>
          ← Νέα αναζήτηση
        </a>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '8px 0 16px' }}>
          {dest ?? 'Αποτελέσματα'}
        </h1>

        {error ? (
          <Card>
            <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
          </Card>
        ) : results.length === 0 ? (
          <Card>
            <p style={{ margin: 0 }}>Δεν βρέθηκαν χώροι. Δοκίμασε άλλη ώρα ή μεγαλύτερη ακτίνα.</p>
          </Card>
        ) : (
          <>
            <MapPanel results={results} />
            {results.map((result) => (
              <FacilityCard
                key={result.id}
                result={result}
                href={`/facility/${result.id}?${detailQuery}`}
              />
            ))}
          </>
        )}
      </Container>
    </>
  )
}
