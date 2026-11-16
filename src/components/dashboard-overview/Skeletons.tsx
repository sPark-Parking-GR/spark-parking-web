import type { CSSProperties } from 'react'

const sk = (width: string | number, height: number, extra: CSSProperties = {}): CSSProperties => ({
  width,
  height,
  ...extra,
})

const BAR_HEIGHTS = [38, 52, 44, 61, 57, 70, 48, 66, 74, 62, 80, 72]

export function KpiSkeleton({ index }: { index: number }) {
  return (
    <article
      className="ov-card ov-kpi"
      style={{ '--i': index } as CSSProperties}
      aria-hidden="true"
      data-state="loading"
    >
      <div className="ov-kpi__top">
        <span className="ov-sk" style={sk(36, 36, { borderRadius: 11 })} />
        <span className="ov-sk" style={sk(`${50 + ((index * 13) % 30)}%`, 12)} />
      </div>
      <div>
        <span className="ov-sk" style={sk(`${44 + ((index * 17) % 34)}%`, 28)} />
        <span className="ov-sk" style={sk('34%', 10, { marginTop: 12 })} />
      </div>
    </article>
  )
}

export function ChartSkeleton() {
  return (
    <div className="ov-chart" aria-hidden="true" data-state="loading">
      <div className="ov-sk-ylabels">
        {[0, 1, 2].map((i) => (
          <span key={i} className="ov-sk" style={sk(40, 10)} />
        ))}
      </div>
      <div className="ov-sk-bars">
        {BAR_HEIGHTS.map((h, i) => (
          <span key={i} className="ov-sk" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="ov-sk-xlabels">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="ov-sk" style={sk(44, 10)} />
        ))}
      </div>
    </div>
  )
}

export function GaugeSkeleton() {
  return (
    <>
      <div className="ov-gauge" aria-hidden="true" data-state="loading">
        <svg viewBox="0 0 200 112">
          <path className="ov-gauge__trk ov-gauge__trk--sk" d="M16 100a84 84 0 0 1 168 0" />
        </svg>
        <div className="ov-gauge__num">
          <span className="ov-sk" style={sk(84, 34, { margin: '0 auto' })} />
        </div>
      </div>
      <div className="ov-occ-side" aria-hidden="true">
        <span className="ov-sk" style={sk(170, 12)} />
        <span className="ov-sk" style={sk(120, 10)} />
      </div>
    </>
  )
}

export function BookingsSkeleton() {
  return (
    <div className="ov-bk-sk" aria-hidden="true" data-state="loading">
      {[0, 1, 2, 3, 4].map((i) => (
        <div className="ov-bk-sk__row" key={i}>
          <span className="ov-sk" style={sk(40, 40, { borderRadius: 12, flex: 'none' })} />
          <div className="ov-bk-sk__lines">
            <span className="ov-sk" style={sk(`${42 + ((i * 19) % 30)}%`, 12)} />
            <span className="ov-sk" style={sk(`${24 + ((i * 11) % 20)}%`, 10)} />
          </div>
          <span className="ov-sk" style={sk(56, 12)} />
          <span className="ov-sk" style={sk(84, 24, { borderRadius: 99 })} />
        </div>
      ))}
    </div>
  )
}
