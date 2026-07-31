import { formatMoney } from '@/lib/booking-format'
import { formatBucketLabel } from '@/lib/analytics-format'
import type { RevenueBucket, RevenuePoint } from '@/lib/analytics-api'

const CHART_WIDTH = 600
const CHART_HEIGHT = 160
const BAR_GAP = 4
const MIN_BAR_HEIGHT = 2

interface Props {
  points: RevenuePoint[]
  currency: string
  bucket: RevenueBucket
  ariaLabel: string
}

export function RevenueChart({ points, currency, bucket, ariaLabel }: Props) {
  const max = Math.max(1, ...points.map((p) => p.netRevenueCents))
  const barWidth =
    points.length > 0 ? (CHART_WIDTH - BAR_GAP * (points.length - 1)) / points.length : 0

  const first = points[0]
  const last = points[points.length - 1]

  return (
    <div className="revenue-chart">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="revenue-chart__svg"
        role="img"
        aria-label={ariaLabel}
        preserveAspectRatio="none"
      >
        {points.map((point, index) => {
          const barHeight = Math.max(MIN_BAR_HEIGHT, (point.netRevenueCents / max) * CHART_HEIGHT)
          const x = index * (barWidth + BAR_GAP)
          return (
            <rect
              key={point.bucketStart}
              x={x}
              y={CHART_HEIGHT - barHeight}
              width={barWidth}
              height={barHeight}
              rx={2}
              className="revenue-chart__bar"
            >
              <title>
                {formatBucketLabel(point.bucketStart, bucket)} —{' '}
                {formatMoney(point.netRevenueCents, currency)}
              </title>
            </rect>
          )
        })}
      </svg>
      {first && last ? (
        <div className="revenue-chart__axis text-secondary">
          <span>{formatBucketLabel(first.bucketStart, bucket)}</span>
          <span>{formatBucketLabel(last.bucketStart, bucket)}</span>
        </div>
      ) : null}
    </div>
  )
}
