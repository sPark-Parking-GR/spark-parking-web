'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

const TOAST_MS = 2600

/**
 * One toast at a time, which is all the profile page ever needs. The region stays mounted so
 * assistive tech has a live region to announce into; only its content and visibility change.
 */
export function useToast(): { show: (text: string) => void; toast: ReactNode } {
  const [text, setText] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((next: string) => {
    if (timer.current) clearTimeout(timer.current)
    setText(next)
    setVisible(true)
    timer.current = setTimeout(() => setVisible(false), TOAST_MS)
  }, [])

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const toast = (
    <div className={`pf-toast${visible ? ' pf-toast--on' : ''}`} role="status">
      {text ? (
        <>
          <span className="pf-toast__tick" aria-hidden="true">
            <Check size={15} strokeWidth={2.8} />
          </span>
          {text}
        </>
      ) : null}
    </div>
  )

  return { show, toast }
}
