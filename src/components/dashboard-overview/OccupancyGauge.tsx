'use client'

import { Clock } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useId, useState } from 'react'
import { createDashboardFormatters } from '@/lib/dashboard-format'
import { useCountUp } from './useCountUp'

interface Props {
  ratio: number
  bookedMinutes: number
  capacityMinutes: number
}

const RADIUS = 84
const ARC_LENGTH = Math.PI * RADIUS

export function OccupancyGauge({ ratio, bookedMinutes, capacityMinutes }: Props) {
  const t = useTranslations('overview.occupancyPanel')
  const locale = useLocale()
  const f = createDashboardFormatters(locale)
  const gradientId = useId()
  const clamped = Math.min(1, Math.max(0, ratio))
  const [drawn, setDrawn] = useState(0)
  const shown = useCountUp(clamped)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(clamped))
    return () => cancelAnimationFrame(frame)
  }, [clamped])

  return (
    <>
      <div
        className="ov-gauge ov-rise"
        role="img"
        aria-label={`${t('title')} ${f.percent(clamped)}`}
        data-state="data"
      >
        <svg viewBox="0 0 200 112">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1">
              <stop offset="0" stopColor="#0d7fb6" />
              <stop offset="1" stopColor="#32a5dc" />
            </linearGradient>
          </defs>
          <path className="ov-gauge__trk" d="M16 100a84 84 0 0 1 168 0" />
          <path
            className="ov-gauge__val"
            d="M16 100a84 84 0 0 1 168 0"
            stroke={`url(#${gradientId})`}
            strokeDasharray={ARC_LENGTH}
            strokeDashoffset={ARC_LENGTH * (1 - drawn)}
            style={clamped === 0 ? { opacity: 0 } : undefined}
          />
        </svg>
        <div className="ov-gauge__num">
          <b>{f.percent(shown)}</b>
          <small>{t('ofCapacity')}</small>
        </div>
      </div>
      <div className="ov-occ-side ov-rise" style={{ ['--i' as string]: 2 }}>
        <div className="ov-occ-cap">
          <Clock size={16} strokeWidth={1.8} aria-hidden="true" />
          {t('detail', {
            booked: f.hours(bookedMinutes),
            capacity: f.hours(capacityMinutes),
          })}
        </div>
        <div className="ov-occ-legend" aria-hidden="true">
          <span>
            <i />
            {t('legendBooked')}
          </span>
          <span>
            <i className="is-free" />
            {t('legendAvailable')}
          </span>
        </div>
      </div>
    </>
  )
}
