import { Skeleton } from '@/components/Skeleton'

// An operator can have at most one facility (the one-facility-per-operator cap), so the
// real FacilityCardGrid they'll see never has more than one card — match that exactly
// rather than guessing at a row of placeholders that will immediately shrink to one.
export function FacilityCardGridSkeleton() {
  return (
    <div className="facility-card-grid" role="status" aria-label="Loading facility">
      <div className="facility-card">
        <div className="facility-card__header">
          <Skeleton width={22} height={22} radius={6} />
          <div className="facility-card__identity">
            <Skeleton width={160} height={16} />
            <Skeleton width={120} height={13} className="facility-card__address" />
          </div>
        </div>

        <div className="facility-card__badges">
          <Skeleton width={56} height={22} radius={999} />
          <Skeleton width={64} height={22} radius={999} />
          <Skeleton width={72} height={22} radius={999} />
        </div>

        <div className="facility-card__divider" />

        <div className="facility-card__stats">
          <div className="facility-card__stat">
            <Skeleton width={40} height={20} />
            <Skeleton width={70} height={12} style={{ marginTop: 4 }} />
          </div>
          <div className="facility-card__stat">
            <Skeleton width={40} height={20} />
            <Skeleton width={70} height={12} style={{ marginTop: 4 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
