'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, TouchEvent } from 'react'
import { usePathname } from 'next/navigation'
import type { NavMode } from '@/lib/nav'

const DESKTOP_QUERY = '(min-width: 901px)'
const SWIPE_CLOSE_PX = 60

interface MobileNavContextValue {
  open: boolean
  toggle: () => void
  close: () => void
}

const MobileNavContext = createContext<MobileNavContextValue | null>(null)

export function useMobileNav(): MobileNavContextValue {
  const ctx = useContext(MobileNavContext)
  if (!ctx) throw new Error('useMobileNav must be used inside ShellFrame')
  return ctx
}

export function ShellFrame({ navMode, children }: { navMode: NavMode; children: ReactNode }) {
  const pathname = usePathname()
  // Keyed to the path it was opened on, so navigating closes the drawer without an effect.
  const [openPath, setOpenPath] = useState<string | null>(null)
  const open = openPath === pathname
  const frameRef = useRef<HTMLDivElement>(null)
  const swipeStartX = useRef<number | null>(null)

  const close = useCallback(() => setOpenPath(null), [])
  const toggle = useCallback(
    () => setOpenPath((current) => (current === pathname ? null : pathname)),
    [pathname],
  )

  useEffect(() => {
    if (!open) return
    const frame = frameRef.current
    const main = frame?.querySelector('.dashboard-main')
    const returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.documentElement.style.overflow

    main?.setAttribute('inert', '')
    document.documentElement.style.overflow = 'hidden'
    frame?.querySelector<HTMLElement>('[data-drawer-close]')?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPath(null)
    }
    const desktop = window.matchMedia(DESKTOP_QUERY)
    const onBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setOpenPath(null)
    }
    document.addEventListener('keydown', onKeyDown)
    desktop.addEventListener('change', onBreakpoint)

    return () => {
      main?.removeAttribute('inert')
      document.documentElement.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      desktop.removeEventListener('change', onBreakpoint)
      returnTo?.focus()
    }
  }, [open])

  const value = useMemo(() => ({ open, toggle, close }), [open, toggle, close])

  const onTouchStart = (event: TouchEvent) => {
    swipeStartX.current = open ? (event.touches[0]?.clientX ?? null) : null
  }
  const onTouchEnd = (event: TouchEvent) => {
    const start = swipeStartX.current
    const end = event.changedTouches[0]?.clientX
    swipeStartX.current = null
    if (start !== null && end !== undefined && start - end > SWIPE_CLOSE_PX) close()
  }

  return (
    <MobileNavContext.Provider value={value}>
      <div
        ref={frameRef}
        className="dashboard-shell"
        data-nav-mode={navMode}
        data-nav-open={open ? 'true' : undefined}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {children}
        <button
          type="button"
          className="shell-backdrop"
          tabIndex={-1}
          aria-hidden="true"
          onClick={close}
        />
      </div>
    </MobileNavContext.Provider>
  )
}
