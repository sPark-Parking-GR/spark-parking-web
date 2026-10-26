'use client'

import Link from 'next/link'
import { LogOut, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LanguageSwitch } from '@/components/LanguageSwitch'
import { LegalFooterLinks } from '@/components/LegalConsent'
import { ThemeToggle } from '@/components/ThemeToggle'
import { signOutAction } from '@/lib/auth-actions'

interface AccountMenuProps {
  name: string
  email: string
  roleLabel: string
  initials: string
}

function SignOutItem() {
  const { pending } = useFormStatus()
  const t = useTranslations('shell')
  return (
    <button
      type="submit"
      className="account-menu__item account-menu__item--danger"
      disabled={pending}
    >
      <LogOut size={18} strokeWidth={2} aria-hidden="true" />
      {pending ? t('exiting') : t('exit')}
    </button>
  )
}

export function AccountMenu({ name, email, roleLabel, initials }: AccountMenuProps) {
  const t = useTranslations('shell')
  const pathname = usePathname()
  // Keyed to the path it was opened on, so choosing a link closes the menu without an effect.
  const [openPath, setOpenPath] = useState<string | null>(null)
  const open = openPath === pathname
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenPath(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpenPath(null)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="topbar__avatar account-menu__trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t('accountMenu')}
        onClick={() => setOpenPath(open ? null : pathname)}
      >
        {initials}
      </button>
      {open ? (
        <div className="account-menu__panel" role="group" aria-label={t('accountMenu')}>
          <div className="account-menu__identity">
            <span className="account-menu__name">{name}</span>
            <span className="account-menu__role">{roleLabel}</span>
            <span className="account-menu__email">{email}</span>
          </div>
          <Link href="/dashboard/profile" className="account-menu__item">
            <UserRound size={18} strokeWidth={2} aria-hidden="true" />
            {t('profile')}
          </Link>
          <div className="account-menu__row">
            <span>{t('language')}</span>
            <LanguageSwitch />
          </div>
          <div className="account-menu__row">
            <span>{t('theme')}</span>
            <ThemeToggle />
          </div>
          <div className="account-menu__row account-menu__row--legal">
            <LegalFooterLinks />
          </div>
          <form action={signOutAction}>
            <SignOutItem />
          </form>
        </div>
      ) : null}
    </div>
  )
}
