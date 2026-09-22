import { formatMoney } from '@/lib/booking-format'
import { formatBucketLabel } from '@/lib/analytics-format'
import type { RevenueBucket, RevenuePoint } from '@/lib/analytics-api'

const CHART_WIDTH = 600
const CHART_HEIGHT = 160
const BAR_GAP = 4
const MIN_BAR_HEIGHT = 2
const TICK_COUNT = 4
// A fresh tenant has zero revenue everywhere; without a placeholder scale the axis
// would collapse to a single "0" tick and the chart reads as broken, not empty.
const ZERO_STATE_SCALE_CENTS = 10000

interface Props {
  points: RevenuePoint[]
  currency: string
  bucket: RevenueBucket
  ariaLabel: string
}

function niceNumber(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range))
  const fraction = range / 10 ** exponent
  let niceFraction: number
  if (round) {
    if (fraction < 1.5) niceFraction = 1
    else if (fraction < 3) niceFraction = 2
    else if (fraction < 7) niceFraction = 5
    else niceFraction = 10
  } else {
    if (fraction <= 1) niceFraction = 1
    else if (fraction <= 2) niceFraction = 2
    else if (fraction <= 5) niceFraction = 5
    else niceFraction = 10
  }
  return niceFraction * 10 ** exponent
}

function computeTicks(maxValue: number, tickCount: number): number[] {
  const niceRange = niceNumber(maxValue, false)
  const step = niceNumber(niceRange / (tickCount - 1), true)
  const niceMax = Math.ceil(maxValue / step) * step
  const ticks: number[] = []
  for (let value = 0; value <= niceMax + step / 2; value += step) {
    ticks.push(Math.round(value))
  }
  return ticks
}

export function RevenueChart({ points, currency, bucket, ariaLabel }: Props) {
  const rawMax = Math.max(0, ...points.map((p) => p.netRevenueCents))
  const ticks = computeTicks(rawMax > 0 ? rawMax : ZERO_STATE_SCALE_CENTS, TICK_COUNT)
  const axisMax = Math.max(ticks[ticks.length - 1] ?? 1, 1)
  const barWidth =
    points.length > 0 ? (CHART_WIDTH - BAR_GAP * (points.length - 1)) / points.length : 0

  const first = points[0]
  const last = points[points.length - 1]

  return (
    <div className="revenue-chart">
      <div className="revenue-chart__grid">
        <div className="revenue-chart__yaxis text-secondary">
          {[...ticks].reverse().map((tick) => (
            <span key={tick}>{formatMoney(tick, currency)}</span>
          ))}
        </div>
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="revenue-chart__svg"
          role="img"
          aria-label={ariaLabel}
          preserveAspectRatio="none"
        >
          {ticks.map((tick) => {
            const y = CHART_HEIGHT - (tick / axisMax) * CHART_HEIGHT
            return (
              <line
                key={tick}
                x1={0}
                x2={CHART_WIDTH}
                y1={y}
                y2={y}
                className="revenue-chart__gridline"
              />
            )
          })}
          {points.map((point, index) => {
            const barHeight =
              point.netRevenueCents > 0
                ? Math.max(MIN_BAR_HEIGHT, (point.netRevenueCents / axisMax) * CHART_HEIGHT)
                : 0
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
                {/* One expression, not three children: SSR and hydration disagree about the
                    whitespace between adjacent text nodes inside an SVG <title>, and the
                    mismatch made the whole dashboard tree re-render on the client. */}
                <title>{`${formatBucketLabel(point.bucketStart, bucket)} — ${formatMoney(point.netRevenueCents, currency)}`}</title>
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
    </div>
  )
}
