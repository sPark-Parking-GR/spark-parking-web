'use client'

import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMobileNav } from '@/components/ShellFrame'

export const SIDEBAR_ID = 'app-sidebar'

export function MenuButton() {
  const { open, toggle } = useMobileNav()
  const t = useTranslations('shell')

  return (
    <button
      type="button"
      className="icon-btn topbar__menu"
      onClick={toggle}
      aria-expanded={open}
      aria-controls={SIDEBAR_ID}
      aria-label={t('openMenu')}
    >
      <Menu size={20} strokeWidth={2} aria-hidden="true" />
    </button>
  )
}

export function DrawerCloseButton() {
  const { close } = useMobileNav()
  const t = useTranslations('shell')

  return (
    <button
      type="button"
      className="icon-btn sidebar__close"
      onClick={close}
      aria-label={t('closeMenu')}
      data-drawer-close
    >
      <X size={20} strokeWidth={2} aria-hidden="true" />
    </button>
  )
}
