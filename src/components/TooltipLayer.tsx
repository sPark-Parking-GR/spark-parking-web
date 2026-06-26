'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const GAP = 8
const MARGIN = 8

interface TipState {
  text: string
  pos: string
  x: number
  y: number
  show: boolean
}

const HIDDEN: TipState = { text: '', pos: 'top', x: -9999, y: -9999, show: false }

export function TooltipLayer() {
  const ref = useRef<HTMLDivElement>(null)
  const anchor = useRef<HTMLElement | null>(null)
  const [tip, setTip] = useState<TipState>(HIDDEN)

  useEffect(() => {
    function enter(e: Event) {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-tooltip]')
      if (!el || el === anchor.current) return
      const text = el.getAttribute('data-tooltip')
      if (!text) return
      anchor.current = el
      setTip({ text, pos: el.getAttribute('data-tooltip-pos') ?? 'top', x: -9999, y: -9999, show: true })
    }

    function leave(e: Event) {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-tooltip]')
      if (!el || el !== anchor.current) return
      const related = (e as MouseEvent | FocusEvent).relatedTarget as Node | null
      if (related && el.contains(related)) return
      anchor.current = null
      setTip((p) => ({ ...p, show: false }))
    }

    function dismiss() {
      if (!anchor.current) return
      anchor.current = null
      setTip((p) => ({ ...p, show: false }))
    }

    document.addEventListener('mouseover', enter)
    document.addEventListener('mouseout', leave)
    document.addEventListener('focusin', enter)
    document.addEventListener('focusout', leave)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => {
      document.removeEventListener('mouseover', enter)
      document.removeEventListener('mouseout', leave)
      document.removeEventListener('focusin', enter)
      document.removeEventListener('focusout', leave)
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [])

  useLayoutEffect(() => {
    const el = anchor.current
    const node = ref.current
    if (!tip.show || !el || !node) return

    const r = el.getBoundingClientRect()
    const tw = node.offsetWidth
    const th = node.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight

    let x: number
    let y: number
    if (tip.pos === 'right' && r.right + GAP + tw <= vw - MARGIN) {
      x = r.right + GAP
      y = r.top + r.height / 2 - th / 2
    } else {
      x = r.left + r.width / 2 - tw / 2
      y = r.top - th - GAP
      if (y < MARGIN) y = r.bottom + GAP
    }

    x = Math.min(Math.max(x, MARGIN), vw - tw - MARGIN)
    y = Math.min(Math.max(y, MARGIN), vh - th - MARGIN)

    if (x !== tip.x || y !== tip.y) setTip((p) => ({ ...p, x, y }))
  }, [tip.show, tip.text, tip.pos, tip.x, tip.y])

  return (
    <div
      ref={ref}
      className="tooltip-pop"
      data-show={tip.show ? 'true' : 'false'}
      style={{ transform: `translate(${tip.x}px, ${tip.y}px)` }}
      role="tooltip"
      aria-hidden="true"
    >
      {tip.text}
    </div>
  )
}
