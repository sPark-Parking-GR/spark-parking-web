'use client'

import { ChartLine, Table2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { RevenueBucket, RevenuePoint } from '@/lib/analytics-api'
import { createDashboardFormatters } from '@/lib/dashboard-format'
import { SectionCard } from './SectionCard'

interface Props {
  points: RevenuePoint[]
  currency: string
  bucket: RevenueBucket
}

const DEFAULT_WIDTH = 600
const DEFAULT_HEIGHT = 250
const PAD_BOTTOM = 26
const PAD_TOP = 8
const PAD_RIGHT = 6
const ZERO_STATE_MAX_CENTS = 10000

export function niceMax(value: number): number {
  if (value <= 0) return ZERO_STATE_MAX_CENTS
  const p = 10 ** Math.floor(Math.log10(value))
  const n = value / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p
}

export function labelIndexes(count: number, width: number): number[] {
  if (count === 0) return []
  const wanted = width < 420 ? 3 : width < 700 ? 4 : 6
  if (count === 1) return [0]
  return [
    ...new Set(
      Array.from({ length: wanted }, (_, k) => Math.round((k * (count - 1)) / (wanted - 1))),
    ),
  ]
}

function smoothPath(xs: Array<[number, number]>): string {
  const first = xs[0]
  if (!first) return ''
  let d = `M${first[0]},${first[1]}`
  for (let i = 1; i < xs.length; i++) {
    const prev = xs[i - 1]
    const cur = xs[i]
    if (!prev || !cur) continue
    const cx = (prev[0] + cur[0]) / 2
    d += ` C${cx},${prev[1]} ${cx},${cur[1]} ${cur[0]},${cur[1]}`
  }
  return d
}

function useSize() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (el.clientWidth > 0)
        setSize({ width: el.clientWidth, height: el.clientHeight || DEFAULT_HEIGHT })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, size] as const
}

export function RevenueAreaChart({ points, currency, bucket }: Props) {
  const t = useTranslations('overview')
  const locale = useLocale()
  const f = useMemo(() => createDashboardFormatters(locale), [locale])
  const gradientId = useId()
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [hover, setHover] = useState<number | null>(null)
  const [ref, { width, height }] = useSize()
  const lineRef = useRef<SVGPathElement>(null)
  const [lineLength, setLineLength] = useState<number | null>(null)

  const empty = points.every((p) => p.netRevenueCents <= 0)
  const max = niceMax(empty ? 0 : Math.max(...points.map((p) => p.netRevenueCents)) * 1.08)
  const axisLabels = [0, max / 2, max].map((v) => f.moneyAxis(v, currency))
  const padL = Math.max(44, Math.max(...axisLabels.map((l) => l.length)) * 7 + 10)
  const iw = Math.max(1, width - padL - PAD_RIGHT)
  const ih = Math.max(1, height - PAD_BOTTOM - PAD_TOP)
  const x = (i: number) => padL + (points.length <= 1 ? iw / 2 : (i * iw) / (points.length - 1))
  const y = (v: number) => PAD_TOP + ih - (v / max) * ih
  const xs: Array<[number, number]> = points.map((p, i) => [x(i), y(p.netRevenueCents)])
  const line = smoothPath(xs)
  const last = xs[xs.length - 1]
  const first = xs[0]
  const area =
    last && first ? `${line} L${last[0]},${PAD_TOP + ih} L${first[0]},${PAD_TOP + ih} Z` : ''

  useEffect(() => {
    if (lineRef.current && typeof lineRef.current.getTotalLength === 'function') {
      setLineLength(Math.ceil(lineRef.current.getTotalLength()))
    }
  }, [line])

  const longLabel = (iso: string) =>
    bucket === 'week'
      ? t('revenuePanel.weekOf', { date: f.bucketLong(iso, bucket) })
      : f.bucketLong(iso, bucket)

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (points.length === 0 || empty) return
    const rect = e.currentTarget.getBoundingClientRect()
    const scale = rect.width > 0 ? width / rect.width : 1
    const px = (e.clientX - rect.left) * scale
    const idx = Math.round(((px - padL) / iw) * (points.length - 1))
    setHover(Math.max(0, Math.min(points.length - 1, idx)))
  }

  const hovered = hover !== null ? points[hover] : undefined
  const hoveredXy = hover !== null ? xs[hover] : undefined
  const tipLeft = hoveredXy ? Math.min(Math.max(0, hoveredXy[0] + 12), Math.max(0, width - 150)) : 0

  const actions = (
    <div className="ov-mini-seg" role="group" aria-label={t('revenuePanel.viewAs')}>
      <button
        type="button"
        aria-pressed={view === 'chart'}
        aria-label={t('revenuePanel.asChart')}
        data-tooltip={t('revenuePanel.asChart')}
        data-tooltip-pos="bottom"
        disabled={empty}
        onClick={() => setView('chart')}
      >
        <ChartLine size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-pressed={view === 'table'}
        aria-label={t('revenuePanel.asTable')}
        data-tooltip={t('revenuePanel.asTable')}
        data-tooltip-pos="bottom"
        disabled={empty}
        onClick={() => setView('table')}
      >
        <Table2 size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </div>
  )

  return (
    <SectionCard
      titleId="ov-revenue-title"
      title={t('revenuePanel.title')}
      subtitle={t('revenuePanel.subtitle')}
      actions={actions}
    >
      <div className="ov-chart-body">
        {view === 'table' && !empty ? (
          <div className="ov-rtable ov-rise">
            <table>
              <caption className="ov-sr">{t('revenuePanel.title')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('revenuePanel.date')}</th>
                  <th scope="col">{t('revenuePanel.title')}</th>
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((p) => (
                  <tr key={p.bucketStart}>
                    <td>{longLabel(p.bucketStart)}</td>
                    <td>{f.money(p.netRevenueCents, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            ref={ref}
            className={`ov-chart ov-rise${empty ? ' is-dim' : ''}${hover !== null ? ' is-hov' : ''}`}
            data-state={empty ? 'empty' : 'data'}
          >
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={t('revenuePanel.chartLabel')}
              onPointerMove={onMove}
              onPointerDown={onMove}
              onPointerLeave={() => setHover(null)}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#32a5dc" stopOpacity=".32" />
                  <stop offset="1" stopColor="#32a5dc" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, max / 2, max].map((v, k) => (
                <g key={k}>
                  <line
                    className={`ov-chart__gl${k === 0 ? ' is-base' : ''}`}
                    x1={padL}
                    x2={width - PAD_RIGHT}
                    y1={y(v)}
                    y2={y(v)}
                  />
                  <text x={padL - 10} y={y(v) + 4} textAnchor="end">
                    {axisLabels[k]}
                  </text>
                </g>
              ))}
              {labelIndexes(points.length, width).map((i, k, all) => {
                const p = points[i]
                if (!p) return null
                return (
                  <text
                    key={i}
                    x={x(i)}
                    y={height - 6}
                    textAnchor={k === 0 ? 'start' : k === all.length - 1 ? 'end' : 'middle'}
                  >
                    {f.bucketShort(p.bucketStart, bucket)}
                  </text>
                )
              })}
              {empty || points.length === 0 ? null : (
                <>
                  <path className="ov-chart__area" d={area} fill={`url(#${gradientId})`} />
                  <path
                    ref={lineRef}
                    className="ov-chart__line is-draw"
                    d={line}
                    style={lineLength !== null ? { ['--len' as string]: lineLength } : undefined}
                  />
                </>
              )}
              {empty || !hoveredXy ? null : (
                <>
                  <line
                    className="ov-chart__xh"
                    x1={hoveredXy[0]}
                    x2={hoveredXy[0]}
                    y1={PAD_TOP}
                    y2={PAD_TOP + ih}
                  />
                  <circle className="ov-chart__dot" r={5} cx={hoveredXy[0]} cy={hoveredXy[1]} />
                </>
              )}
            </svg>
            {hovered && hoveredXy ? (
              <div
                className="ov-ctip"
                style={{ left: tipLeft, top: Math.max(0, hoveredXy[1] - 54) }}
                aria-hidden="true"
              >
                <small>{longLabel(hovered.bucketStart)}</small>
                <b>{f.money(hovered.netRevenueCents, currency)}</b>
              </div>
            ) : null}
            {empty ? (
              <div className="ov-chart-empty ov-rise" role="status">
                <span className="ov-state__ic ov-state__ic--sm" aria-hidden="true">
                  <ChartLine size={22} strokeWidth={1.8} />
                </span>
                <b>{t('revenuePanel.emptyTitle')}</b>
                <p>{t('revenuePanel.emptyMessage')}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </SectionCard>
  )
}
