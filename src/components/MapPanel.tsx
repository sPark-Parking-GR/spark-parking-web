import type { FacilitySearchResult } from '../lib/api'

export function MapPanel({ results }: { results: FacilitySearchResult[] }) {
  return (
    <div
      style={{
        position: 'relative',
        height: 220,
        borderRadius: 14,
        border: '1px solid var(--color-border)',
        background:
          'repeating-linear-gradient(45deg, #EDF2F7, #EDF2F7 12px, #F9F8F6 12px, #F9F8F6 24px)',
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 4,
          color: 'var(--color-text-secondary)',
          fontSize: 13,
        }}
      >
        <strong style={{ color: 'var(--color-text-main)' }}>{results.length} χώροι στάθμευσης</strong>
        <span>Χάρτης: προστίθεται με κλειδί παρόχου (Google/Mapbox)</span>
      </div>
    </div>
  )
}
