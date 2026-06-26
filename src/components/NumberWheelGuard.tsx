'use client'

import { useEffect } from 'react'

export function NumberWheelGuard() {
  useEffect(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set

    function onWheel(e: WheelEvent) {
      const el = e.target
      if (!(el instanceof HTMLInputElement) || el.type !== 'number') return
      if (document.activeElement !== el || el.readOnly || el.disabled) return

      e.preventDefault()
      if (!setter) return

      const stepRaw = el.step
      const step = stepRaw && stepRaw !== 'any' ? Number(stepRaw) : 1
      if (!Number.isFinite(step) || step <= 0) return

      const decimals = stepRaw.includes('.') ? (stepRaw.split('.')[1]?.length ?? 0) : 0
      const current = el.value === '' ? 0 : Number(el.value)
      if (!Number.isFinite(current)) return

      let next = current + (e.deltaY < 0 ? 1 : -1) * step
      if (el.min !== '') next = Math.max(next, Number(el.min))
      if (el.max !== '') next = Math.min(next, Number(el.max))
      next = Number(next.toFixed(decimals))

      setter.call(el, String(next))
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }

    document.addEventListener('wheel', onWheel, { passive: false })
    return () => document.removeEventListener('wheel', onWheel)
  }, [])

  return null
}
