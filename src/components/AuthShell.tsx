'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { LegalFooterLinks } from './LegalConsent'
import { SparkMark } from './SparkMark'

const OCCUPANCY_CELLS = Array.from({ length: 60 }, (_, index) => {
  const roll = (index * 37 + 11) % 10
  const state = roll < 5 ? 'taken' : roll < 8 ? 'free' : 'held'
  return { state, pulses: index % 7 === 0, delay: (index % 5) * 0.6 }
})

function BrandLockup({ gradientId }: { gradientId: string }) {
  const t = useTranslations('authShell')

  return (
    <span className="auth-brand__lockup">
      <SparkMark
        size={34}
        className="brand-lockup__mark"
        gradientId={gradientId}
        title={t('logoAlt')}
      />
      <Image
        src="/sPark_title.png"
        alt={t('logoAlt')}
        width={302}
        height={72}
        priority
        className="auth-brand__title"
      />
    </span>
  )
}

export function AuthNote({
  tone,
  leaving,
  onGone,
  children,
}: {
  tone: 'ok' | 'warn'
  leaving?: boolean
  onGone?: () => void
  children: ReactNode
}) {
  return (
    <p
      className={`auth-note auth-note--${tone}${leaving ? ' auth-note--leaving' : ''}`}
      role="status"
      onAnimationEnd={(event) => {
        if (leaving && event.target === event.currentTarget) onGone?.()
      }}
    >
      {children}
    </p>
  )
}

interface AuthShellProps {
  titleId: string
  title: string
  subtitle?: ReactNode
  tagline: string
  heroTitle: string
  heroSubtitle: string
  isExiting?: boolean
  notice?: ReactNode
  children: ReactNode
}

/**
 * The frame every auth page shares: brand, a side panel with a per-page headline over the
 * decorative facility grid, the form column and the legal footer (the ambient glow lives on
 * .auth-shell). `isExiting` drives the exit classes the login page has always used, so any
 * page that can succeed and move on hands off identically.
 *
 * Layout: two columns from 900px, a centred card from 600px, a bare full-height column below.
 */
export function AuthShell({
  titleId,
  title,
  subtitle,
  tagline,
  heroTitle,
  heroSubtitle,
  isExiting = false,
  notice,
  children,
}: AuthShellProps) {
  return (
    <div className="auth-layout">
      <section className={isExiting ? 'auth-hero auth-hero--exiting' : 'auth-hero'}>
        <BrandLockup gradientId="spark-auth-hero-grad" />
        <p className="auth-hero__title">{heroTitle}</p>
        <p className="auth-hero__subtitle">{heroSubtitle}</p>
        <div className="auth-occ" aria-hidden="true">
          {OCCUPANCY_CELLS.map((cell, index) => (
            <span
              key={index}
              className={`auth-occ__cell auth-occ__cell--${cell.state}${cell.pulses ? ' auth-occ__cell--pulse' : ''}`}
              style={cell.pulses ? { animationDelay: `${cell.delay}s` } : undefined}
            />
          ))}
        </div>
      </section>

      <div className="auth-panel">
        <div className="auth-stack">
          <div className={isExiting ? 'auth-brand auth-brand--exiting' : 'auth-brand'}>
            <BrandLockup gradientId="spark-auth-grad" />
            <p className="auth-brand__tagline">{tagline}</p>
          </div>

          <section
            className={isExiting ? 'auth-card auth-card--exiting' : 'auth-card'}
            aria-labelledby={titleId}
          >
            <h1 id={titleId} className="h-heading auth-card__title">
              {title}
            </h1>
            {subtitle ? <p className="auth-card__context">{subtitle}</p> : null}
            {notice}
            {children}
          </section>
          <LegalFooterLinks />
        </div>
      </div>
    </div>
  )
}
