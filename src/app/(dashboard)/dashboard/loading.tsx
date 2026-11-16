import {
  BookingsSkeleton,
  ChartSkeleton,
  GaugeSkeleton,
  KpiSkeleton,
} from '@/components/dashboard-overview/Skeletons'

export default function Loading() {
  return (
    <div className="ov" aria-busy="true">
      <header className="ov-phead">
        <div>
          <span className="ov-sk" style={{ width: 180, height: 34, display: 'block' }} />
          <span
            className="ov-sk"
            style={{ width: 280, height: 14, display: 'block', marginTop: 10 }}
          />
        </div>
        <span className="ov-sk" style={{ width: 330, height: 44, borderRadius: 12 }} />
      </header>
      <section className="ov-kpis" data-count={5}>
        {[0, 1, 2, 3, 4].map((i) => (
          <KpiSkeleton key={i} index={i} />
        ))}
      </section>
      <div className="ov-row2">
        <section className="ov-card ov-section">
          <div className="ov-chead">
            <div className="ov-chead__grow">
              <span className="ov-sk" style={{ width: 120, height: 16, display: 'block' }} />
            </div>
          </div>
          <div className="ov-chart-body">
            <ChartSkeleton />
          </div>
        </section>
        <section className="ov-card ov-section">
          <div className="ov-chead">
            <div className="ov-chead__grow">
              <span className="ov-sk" style={{ width: 120, height: 16, display: 'block' }} />
            </div>
          </div>
          <div className="ov-occ-body">
            <GaugeSkeleton />
          </div>
        </section>
      </div>
      <section className="ov-card ov-section">
        <div className="ov-chead">
          <div className="ov-chead__grow">
            <span className="ov-sk" style={{ width: 160, height: 16, display: 'block' }} />
          </div>
        </div>
        <BookingsSkeleton />
      </section>
    </div>
  )
}
