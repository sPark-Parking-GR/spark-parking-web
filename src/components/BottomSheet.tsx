'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import type { FacilitySearchResult } from '../lib/api'
import { FacilityCard } from './FacilityCard'

const PEEK = 88
const HEADER_HEIGHT = 64
const CLICK_THRESHOLD = 6

export function BottomSheet({
  results,
  detailQuery,
  loading,
  error,
}: {
  results: FacilitySearchResult[]
  detailQuery: string
  loading: boolean
  error?: string | null
}) {
  const [snaps, setSnaps] = useState<number[]>([PEEK, 400, 600])
  const [height, setHeight] = useState(PEEK)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ startY: number; startHeight: number; moved: number } | null>(null)

  useEffect(() => {
    const recompute = () => {
      const vh = window.innerHeight
      setSnaps([PEEK, Math.round(vh * 0.5), vh - 96])
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [])

  const snapTo = useCallback(
    (target: number) => {
      const nearest = snaps.reduce((best, s) =>
        Math.abs(s - target) < Math.abs(best - target) ? s : best,
      )
      setHeight(nearest)
    },
    [snaps],
  )

  const onPointerDown = (e: PointerEvent) => {
    drag.current = { startY: e.clientY, startHeight: height, moved: 0 }
    setDragging(true)
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current) return
    const dy = drag.current.startY - e.clientY
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dy))
    const min = snaps[0] ?? PEEK
    const max = snaps[snaps.length - 1] ?? 600
    setHeight(Math.min(max, Math.max(min, drag.current.startHeight + dy)))
  }

  const onPointerUp = () => {
    if (!drag.current) return
    const wasClick = drag.current.moved < CLICK_THRESHOLD
    if (wasClick) {
      const peek = snaps[0] ?? PEEK
      const half = snaps[1] ?? 400
      setHeight(height <= peek + 1 ? half : peek)
    } else {
      snapTo(height)
    }
    drag.current = null
    setDragging(false)
  }

  const headerLabel = error
    ? error
    : loading
      ? 'Αναζήτηση…'
      : `${results.length} χώροι στάθμευσης`

  return (
    <div
      className={`sheet${dragging ? '' : ' sheet--animated'}`}
      style={{ height }}
    >
      <div
        className="sheet__header"
        style={{ height: HEADER_HEIGHT }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="sheet__grip" />
        <div className="sheet__title">
          <strong style={{ fontSize: 15 }}>{headerLabel}</strong>
          <span className="text-secondary" style={{ fontSize: 12 }}>
            {height <= (snaps[0] ?? PEEK) + 1 ? 'Σύρε για λίστα' : 'Λίστα'}
          </span>
        </div>
      </div>

      <div className="sheet__body">
        {loading ? (
          <>
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </>
        ) : results.length === 0 ? (
          <p className="text-secondary" style={{ fontSize: 14 }}>
            Δεν βρέθηκαν χώροι. Δοκίμασε άλλη ώρα ή προορισμό.
          </p>
        ) : (
          results.map((result) => (
            <FacilityCard
              key={result.id}
              result={result}
              href={`/facility/${result.id}?${detailQuery}`}
            />
          ))
        )}
      </div>
    </div>
  )
}
