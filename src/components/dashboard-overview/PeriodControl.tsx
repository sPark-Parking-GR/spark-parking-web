'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useLayoutEffect, useOptimistic, useRef, useState } from 'react'
import { RANGE_PRESETS } from '@/lib/date-range'
import type { RangePreset } from '@/lib/date-range'
import { useDashboardTransition } from './useRouterRefresh'

interface Props {
  active: RangePreset
  hrefs: Record<RangePreset, string>
  showPeriods: boolean
}

export function PeriodControl({ active, hrefs, showPeriods }: Props) {
  const t = useTranslations('dashboardStates')
  const tRange = useTranslations('dateRange')
  const router = useRouter()
  const [pending, startTransition] = useDashboardTransition()
  const [optimistic, setOptimistic] = useOptimistic(active)
  const buttons = useRef<Partial<Record<RangePreset, HTMLButtonElement | null>>>({})
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null)
  const [announce, setAnnounce] = useState('')
  const wasPending = useRef(false)

  useLayoutEffect(() => {
    const el = buttons.current[optimistic]
    if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth })
  }, [optimistic, showPeriods])

  useEffect(() => {
    if (pending) {
      wasPending.current = true
      setAnnounce(t('loadingAnnounce'))
    } else if (wasPending.current) {
      wasPending.current = false
      setAnnounce(t('loadedAnnounce'))
    }
  }, [pending, t])

  const select = (preset: RangePreset) => {
    if (preset === optimistic) return
    startTransition(() => {
      setOptimistic(preset)
      router.push(hrefs[preset])
    })
  }

  const refresh = () => startTransition(() => router.refresh())

  return (
    <div className={`ov-pcontrols${pending ? ' is-loading' : ''}`}>
      {showPeriods ? (
        <div className="ov-seg" role="group" aria-label={tRange('ariaLabel')}>
          {thumb ? (
            <span
              className="ov-seg__thumb"
              aria-hidden="true"
              style={{ width: thumb.width, transform: `translateX(${thumb.left}px)` }}
            />
          ) : null}
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              ref={(el) => {
                buttons.current[preset] = el
              }}
              aria-pressed={preset === optimistic}
              onClick={() => select(preset)}
            >
              {tRange(`presets.${preset}`)}
            </button>
          ))}
        </div>
      ) : null}
      <div className="ov-upd">
        <span>{pending ? t('updating') : t('updated')}</span>
        <button
          type="button"
          className="ov-ibtn"
          aria-label={t('refresh')}
          data-tooltip={t('refresh')}
          data-tooltip-pos="bottom"
          onClick={refresh}
        >
          <RefreshCw size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
      <div className="ov-sr" aria-live="polite" role="status">
        {announce}
      </div>
    </div>
  )
}
