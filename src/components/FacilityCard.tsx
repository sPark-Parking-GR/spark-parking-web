import type { FacilitySearchResult } from '../lib/api'
import { formatDistance, formatMoney } from '../lib/format'
import { Badge, Card } from './ui'

function availability(result: FacilitySearchResult) {
  if (!result.available) return { variant: 'error' as const, label: 'Πλήρες' }
  if (result.remainingSlots <= 5) return { variant: 'warning' as const, label: 'Περιορισμένο' }
  return { variant: 'success' as const, label: 'Διαθέσιμο' }
}

export function FacilityCard({ result, href }: { result: FacilitySearchResult; href: string }) {
  const avail = availability(result)

  return (
    <a href={href}>
      <Card className="facility-card">
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 className="facility-card__title">{result.name}</h3>
            {result.isPromoted ? <Badge variant="neutral">Προτεινόμενο</Badge> : null}
          </div>
          <p className="text-secondary" style={{ fontSize: 13, margin: '0 0 8px' }}>
            {result.address}
          </p>
          <div className="facility-card__meta">
            <Badge variant={avail.variant}>{avail.label}</Badge>
            <span className="text-secondary" style={{ fontSize: 13 }}>
              {formatDistance(result.distanceMeters)}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          <div className="facility-card__price">
            {result.priceCents != null ? formatMoney(result.priceCents, result.currency) : '—'}
          </div>
          <div className="text-secondary" style={{ fontSize: 12 }}>
            συνολικά
          </div>
        </div>
      </Card>
    </a>
  )
}
