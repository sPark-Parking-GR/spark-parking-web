'use client'

import { ChevronsLeft, Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SIDEBAR_ID, useShellNav } from '@/components/ShellFrame'

export function MenuButton() {
  const { open, openMenu } = useShellNav()
  const t = useTranslations('shell')

  return (
    <button
      type="button"
      className="ds-ibtn ds-menu-btn"
      onClick={(event) => openMenu(event.currentTarget)}
      aria-expanded={open}
      aria-controls={SIDEBAR_ID}
      aria-label={t('openMenu')}
    >
      <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
    </button>
  )
}

export function DrawerCloseButton() {
  const { close } = useShellNav()
  const t = useTranslations('shell')

  return (
    <button
      type="button"
      className="ds-ibtn ds-sidebar__close"
      onClick={close}
      aria-label={t('closeMenu')}
      data-drawer-close
    >
      <X size={20} strokeWidth={1.8} aria-hidden="true" />
    </button>
  )
}

// Docked, it folds the sidebar to a rail; in the overlay modes the rail is the resting state
// and this button opens the full panel instead.
export function CollapseButton() {
  const { mode, rail, open, toggleCollapsed, openMenu } = useShellNav()
  const t = useTranslations('shell')
  const label = rail ? t('expandSidebar') : t('collapseSidebar')

  return (
    <button
      type="button"
      className="ds-collapse"
      aria-expanded={mode === 'wide' ? !rail : open}
      aria-controls={SIDEBAR_ID}
      data-tooltip={rail ? label : undefined}
      data-tooltip-pos="right"
      onClick={(event) => (mode === 'wide' ? toggleCollapsed() : openMenu(event.currentTarget))}
    >
      <ChevronsLeft size={20} strokeWidth={1.8} aria-hidden="true" />
      <span className="ds-collapse__label">{label}</span>
    </button>
  )
}
