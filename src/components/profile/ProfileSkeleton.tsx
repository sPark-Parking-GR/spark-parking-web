function Sk({ w, h, r, circle }: { w?: number | string; h: number; r?: number; circle?: boolean }) {
  return (
    <span
      className="ov-sk"
      style={{ width: w ?? '100%', height: h, borderRadius: circle ? '50%' : r, flex: 'none' }}
    />
  )
}

function CardHead() {
  return (
    <div className="pf-chead">
      <Sk w={40} h={40} r={12} />
      <div className="pf-chead__grow pf-sk-stack">
        <Sk w={140} h={14} />
        <Sk w={220} h={10} />
      </div>
    </div>
  )
}

/** Mirrors the loaded layout block for block so nothing shifts when the content arrives. */
export function ProfileSkeleton() {
  return (
    <div className="pf" aria-hidden="true">
      <div className="pf-idc-wrap">
        <aside className="pf-card pf-idc">
          <div className="pf-idc__cover pf-idc__cover--sk" />
          <div className="pf-idc__in">
            <span className="pf-avatar pf-avatar--sk">
              <Sk w="100%" h={88} circle />
            </span>
            <div className="pf-idc__text pf-sk-stack">
              <Sk w="60%" h={16} />
              <Sk w="75%" h={11} />
              <Sk w={90} h={24} r={99} />
            </div>
          </div>
          <div className="pf-lnav">
            <Sk h={36} r={10} />
            <Sk h={36} r={10} />
          </div>
        </aside>
      </div>
      <div className="pf-col">
        <section className="pf-card pf-sec">
          <CardHead />
          <div className="pf-body">
            <div className="pf-grid2">
              <div className="pf-fwrap">
                <Sk h={56} r={12} />
                <Sk w="90%" h={10} />
              </div>
              <div className="pf-fwrap">
                <Sk h={56} r={12} />
              </div>
            </div>
          </div>
          <div className="pf-foot">
            <Sk w={120} h={10} />
            <Sk w={150} h={46} r={12} />
          </div>
        </section>
        <section className="pf-card pf-sec">
          <CardHead />
          <div className="pf-body">
            <div className="pf-sk-steps">
              {[0, 1, 2].map((i) => (
                <span key={i} className="pf-sk-step">
                  <Sk w={32} h={32} circle />
                  <Sk h={10} />
                </span>
              ))}
            </div>
            <div className="pf-sk-stack pf-sk-form">
              <Sk w={150} h={14} />
              <Sk w="85%" h={10} />
              <Sk h={56} r={12} />
              <Sk w={220} h={46} r={12} />
            </div>
            <Sk h={74} r={14} />
          </div>
        </section>
      </div>
    </div>
  )
}
