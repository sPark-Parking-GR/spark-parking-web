'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { ReactNode, TouchEvent } from 'react'
import { usePathname } from 'next/navigation'
import { useDashboardLoading } from '@/components/DashboardLoading'

export type ShellMode = 'wide' | 'mid' | 'narrow'

export const SIDEBAR_ID = 'app-sidebar'
export const SIDEBAR_STORAGE_KEY = 'spark-sb'

const WIDE_QUERY = '(min-width: 1100px)'
const NARROW_QUERY = '(max-width: 699px)'
const SWIPE_CLOSE_PX = 60

interface ShellNavContextValue {
  mode: ShellMode
  open: boolean
  collapsed: boolean
  rail: boolean
  openMenu: (opener: HTMLElement | null) => void
  close: () => void
  toggleCollapsed: () => void
}

const ShellNavContext = createContext<ShellNavContextValue | null>(null)

export function useShellNav(): ShellNavContextValue {
  const ctx = useContext(ShellNavContext)
  if (!ctx) throw new Error('useShellNav must be used inside ShellFrame')
  return ctx
}

function subscribeMode(onChange: () => void): () => void {
  const queries = [window.matchMedia(WIDE_QUERY), window.matchMedia(NARROW_QUERY)]
  for (const query of queries) query.addEventListener('change', onChange)
  return () => {
    for (const query of queries) query.removeEventListener('change', onChange)
  }
}

function readMode(): ShellMode {
  if (window.matchMedia(WIDE_QUERY).matches) return 'wide'
  return window.matchMedia(NARROW_QUERY).matches ? 'narrow' : 'mid'
}

// Layout itself is pure CSS; the mode only decides behaviour that CSS cannot (what is inert,
// which button the footer toggle acts as). Server render assumes the desktop layout.
function useShellMode(): ShellMode {
  return useSyncExternalStore(subscribeMode, readMode, () => 'wide')
}

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'rail'
  } catch {
    return false
  }
}

function writeCollapsed(collapsed: boolean): void {
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? 'rail' : 'full')
  } catch {
    // nothing to remember it with
  }
}

export function ShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const mode = useShellMode()
  const { loading } = useDashboardLoading()
  // Keyed to the path it was opened on, so navigating closes the overlay without an effect.
  const [openPath, setOpenPath] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const open = openPath === pathname && mode !== 'wide'
  const frameRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const swipeStartX = useRef<number | null>(null)

  useEffect(() => {
    setCollapsed(readCollapsed())
  }, [])

  const close = useCallback(() => setOpenPath(null), [])
  const openMenu = useCallback(
    (opener: HTMLElement | null) => {
      openerRef.current = opener
      setOpenPath(pathname)
    },
    [pathname],
  )
  const toggleCollapsed = useCallback(() => {
    setCollapsed(!collapsed)
    writeCollapsed(!collapsed)
  }, [collapsed])

  useEffect(() => {
    const sidebar = frameRef.current?.querySelector(`#${SIDEBAR_ID}`)
    if (!sidebar) return
    if (mode === 'narrow' && !open) sidebar.setAttribute('inert', '')
    else sidebar.removeAttribute('inert')
  }, [mode, open])

  useEffect(() => {
    if (!open) return
    const frame = frameRef.current
    const main = frame?.querySelector('[data-shell-main]')
    const sidebar = frame?.querySelector<HTMLElement>(`#${SIDEBAR_ID}`)
    const opener = openerRef.current

    // On a phone the menu hangs from the header, whose button is the toggle, so only the page
    // below it goes inert; elsewhere the whole column does.
    const inertTargets =
      mode === 'narrow'
        ? Array.from(main?.querySelectorAll('.dashboard-scroll, .ds-tabbar') ?? [])
        : main
          ? [main]
          : []
    for (const el of inertTargets) el.setAttribute('inert', '')
    const target =
      sidebar?.querySelector<HTMLElement>('[aria-current="page"]') ??
      sidebar?.querySelector<HTMLElement>('a[href]') ??
      sidebar?.querySelector<HTMLElement>('[data-drawer-close]')
    target?.focus({ preventScroll: true })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPath(null)
    }
    const onBreakpoint = () => setOpenPath(null)
    const queries = [window.matchMedia(WIDE_QUERY), window.matchMedia(NARROW_QUERY)]
    document.addEventListener('keydown', onKeyDown)
    for (const query of queries) query.addEventListener('change', onBreakpoint)

    return () => {
      for (const el of inertTargets) el.removeAttribute('inert')
      document.removeEventListener('keydown', onKeyDown)
      for (const query of queries) query.removeEventListener('change', onBreakpoint)
      opener?.focus({ preventScroll: true })
    }
  }, [open, mode])

  const rail = (mode === 'wide' && collapsed) || (mode === 'mid' && !open)
  const value = useMemo(
    () => ({ mode, open, collapsed, rail, openMenu, close, toggleCollapsed }),
    [mode, open, collapsed, rail, openMenu, close, toggleCollapsed],
  )

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    swipeStartX.current = open && touch ? (mode === 'narrow' ? touch.clientY : touch.clientX) : null
  }
  const onTouchEnd = (event: TouchEvent) => {
    const start = swipeStartX.current
    const touch = event.changedTouches[0]
    const end = touch ? (mode === 'narrow' ? touch.clientY : touch.clientX) : undefined
    swipeStartX.current = null
    if (start !== null && end !== undefined && start - end > SWIPE_CLOSE_PX) close()
  }

  return (
    <ShellNavContext.Provider value={value}>
      <div
        ref={frameRef}
        className={`dashboard-shell${loading ? ' is-loading' : ''}`}
        data-collapsed={collapsed ? 'true' : undefined}
        data-open={open ? 'true' : undefined}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {children}
        <button
          type="button"
          className="dashboard-scrim"
          tabIndex={-1}
          aria-hidden="true"
          onClick={close}
        />
      </div>
    </ShellNavContext.Provider>
  )
}
