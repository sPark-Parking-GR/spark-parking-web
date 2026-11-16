'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ShieldCheck, TriangleAlert, UserRound } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { initialsOf } from '@/lib/shell-account'

export const DETAILS_ID = 'pf-details'
export const SECURITY_ID = 'pf-security'

interface IdentityCardProps {
  draftName: string
  savedName: string
  email: string
  roleLabel: string
  onAddName: () => void
}

function scrollParent(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.dashboard-scroll')
}

/** Highlights the section nearest the top of the scroll area, as the mockup's scroll-spy does. */
function useScrollSpy(): string {
  const [current, setCurrent] = useState(DETAILS_ID)

  useEffect(() => {
    const scroller = scrollParent()
    if (!scroller) return
    const update = () => {
      const line = scroller.getBoundingClientRect().top + scroller.clientHeight * 0.35
      let next = DETAILS_ID
      for (const id of [DETAILS_ID, SECURITY_ID]) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) next = id
      }
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) {
        next = SECURITY_ID
      }
      setCurrent(next)
    }
    update()
    scroller.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      scroller.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return current
}

export function IdentityCard({
  draftName,
  savedName,
  email,
  roleLabel,
  onAddName,
}: IdentityCardProps) {
  const t = useTranslations('profile')
  const current = useScrollSpy()
  const avatarRef = useRef<HTMLSpanElement>(null)
  const previousInitials = useRef<string | null>(null)

  const name = draftName.trim()
  const shown = name || email
  const initials = initialsOf(shown)

  useEffect(() => {
    const el = avatarRef.current
    if (el && previousInitials.current !== null && previousInitials.current !== initials) {
      el.classList.remove('pf-bump')
      void el.offsetWidth
      el.classList.add('pf-bump')
    }
    previousInitials.current = initials
  }, [initials])

  const goTo = (id: string) => {
    const section = document.getElementById(id)
    if (!section) return
    section.scrollIntoView({ block: 'start' })
    window.setTimeout(() => section.querySelector<HTMLElement>('h2')?.focus(), 400)
  }

  return (
    <div className="pf-idc-wrap">
      <aside className="pf-card pf-idc pf-rise" aria-label={t('identity.label')}>
        <div className="pf-idc__cover" aria-hidden="true" />
        <div className="pf-idc__in">
          <span ref={avatarRef} className="pf-avatar" aria-hidden="true">
            {initials}
          </span>
          <div className="pf-idc__text">
            <b className={name ? undefined : 'pf-idc__fallback'}>{shown}</b>
            {name ? <small>{email}</small> : null}
            <span className="pf-role">
              <ShieldCheck size={14} strokeWidth={1.8} aria-hidden="true" />
              {roleLabel}
            </span>
          </div>
        </div>
        {savedName.trim() === '' ? (
          <div className="pf-hint">
            <TriangleAlert size={20} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <b>{t('identity.addNameTitle')}</b>
              <p>{t('identity.addNameText')}</p>
              <button type="button" className="pf-link" onClick={onAddName}>
                {t('identity.addNameLink')}
                <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}
        <nav className="pf-lnav" aria-label={t('identity.navLabel')}>
          {[
            {
              id: DETAILS_ID,
              label: t('heading'),
              icon: <UserRound size={18} strokeWidth={1.8} />,
            },
            {
              id: SECURITY_ID,
              label: t('security.heading'),
              icon: <ShieldCheck size={18} strokeWidth={1.8} />,
            },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={current === item.id ? 'pf-lnav__on' : undefined}
              aria-current={current === item.id ? 'location' : undefined}
              onClick={(event) => {
                event.preventDefault()
                goTo(item.id)
              }}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
    </div>
  )
}
