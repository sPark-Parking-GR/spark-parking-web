'use client'

import Link from 'next/link'
import { Info } from 'lucide-react'
import { useLocale } from 'next-intl'
import type { CSSProperties, ReactNode } from 'react'
import { createDashboardFormatters } from '@/lib/dashboard-format'
import { useCountUp } from './useCountUp'

export type KpiTone = 'blue' | 'violet' | 'green' | 'amber' | 'cyan'

export type KpiValue =
  | { kind: 'number'; value: number }
  | { kind: 'percent'; ratio: number }
  | { kind: 'currency'; cents: number; currency: string }
  | { kind: 'text'; text: string }

interface Props {
  label: string
  hint: string
  icon: ReactNode
  tone: KpiTone
  index: number
  href?: string
  sub?: string
  showBar?: boolean
  errorLabel?: string
  data?: KpiValue
}

function numericTarget(data: KpiValue): number {
  if (data.kind === 'number') return data.value
  if (data.kind === 'percent') return data.ratio
  if (data.kind === 'currency') return data.cents
  return 0
}

function AnimatedValue({ data }: { data: KpiValue }) {
  const locale = useLocale()
  const current = useCountUp(numericTarget(data))
  const f = createDashboardFormatters(locale)

  if (data.kind === 'text') return <>{data.text}</>
  if (data.kind === 'number') return <>{f.number(current)}</>
  if (data.kind === 'percent') return <>{f.percent(current)}</>
  return <>{f.money(current, data.currency)}</>
}

export function KpiCard({
  label,
  hint,
  icon,
  tone,
  index,
  href,
  sub,
  showBar,
  errorLabel,
  data,
}: Props) {
  const style = {
    '--tc': `var(--d-t-${tone})`,
    '--tb': `var(--d-t-${tone}-bg)`,
    '--i': index,
  } as CSSProperties
  const barPct =
    data?.kind === 'percent' ? Math.round(Math.min(1, Math.max(0, data.ratio)) * 100) : 0

  return (
    <article
      className={`ov-card ov-kpi ov-rise${data ? '' : ' ov-kpi--err'}`}
      style={style}
      data-state={data ? 'data' : 'error'}
    >
      {href ? <Link href={href} className="ov-kpi__link" aria-label={label} /> : null}
      <div className="ov-kpi__top">
        <span className="ov-chip" aria-hidden="true">
          {icon}
        </span>
        <span className="ov-kpi__lbl">{label}</span>
        <button
          type="button"
          className="ov-info"
          data-tooltip={hint}
          data-tooltip-pos="bottom"
          aria-label={hint}
        >
          <Info size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
      <div>
        <div className="ov-kpi__val">{data ? <AnimatedValue data={data} /> : '—'}</div>
        {!data ? (
          <div className="ov-kpi__sub ov-kpi__sub--warn">{errorLabel}</div>
        ) : sub ? (
          <div className="ov-kpi__sub">{sub}</div>
        ) : showBar ? null : (
          <div className="ov-kpi__sub" />
        )}
        {showBar && data ? (
          <div className="ov-kpi__bar" aria-hidden="true">
            <i style={{ width: `${barPct}%` }} />
          </div>
        ) : null}
      </div>
    </article>
  )
}
