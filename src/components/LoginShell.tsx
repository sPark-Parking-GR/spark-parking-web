'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { LegalFooterLinks } from './LegalConsent'
import { LoginForm } from './LoginForm'
import { SparkMark } from './SparkMark'
import { useAuthPageExit } from '@/lib/useAuthPageExit'

type LoginError = 'forbidden' | 'restricted' | 'expired'

interface LoginShellProps {
  from?: string
  error?: LoginError
  reset?: 'success'
  linked?: 'success'
}

type Notice = { tone: 'ok' | 'warn'; messageKey: string }
type NoticePhase = 'shown' | 'leaving' | 'gone'

const OCCUPANCY_CELLS = Array.from({ length: 60 }, (_, index) => {
  const roll = (index * 37 + 11) % 10
  const state = roll < 5 ? 'taken' : roll < 8 ? 'free' : 'held'
  return { state, pulses: index % 7 === 0, delay: (index % 5) * 0.6 }
})

function noticeFor({ error, reset, linked }: Omit<LoginShellProps, 'from'>): Notice | null {
  if (error === 'forbidden') return { tone: 'warn', messageKey: 'forbiddenMessage' }
  if (error === 'restricted') return { tone: 'warn', messageKey: 'restrictedMessage' }
  if (error === 'expired') return { tone: 'warn', messageKey: 'sessionExpired' }
  if (reset === 'success') return { tone: 'ok', messageKey: 'resetSuccess' }
  if (linked === 'success') return { tone: 'ok', messageKey: 'accountLinked' }
  return null
}

function BrandLockup({ gradientId }: { gradientId: string }) {
  const t = useTranslations('login')

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

/**
 * Full login-page shell as a client component so that the brand, the hero and the
 * auth-card can respond to the same `isExiting` state.
 *
 * Entrance – brand slides down from above, card fades/scales in 120ms behind it.
 * Exit     – everything pushes forward (zoom + blur) together, since this only fires on a
 *            successful sign-in — not a reverse of the entrance, which would read
 *            as retreating instead of moving through to the dashboard.
 *
 * Layout   – two columns from 900px (hero left, form right), a centred card from 600px, and a
 *            bare full-height column on phones.
 */
export function LoginShell({ from, error, reset, linked }: LoginShellProps) {
  const t = useTranslations('login')
  const { isExiting, triggerExit } = useAuthPageExit()
  const notice = noticeFor({ error, reset, linked })
  const [noticePhase, setNoticePhase] = useState<NoticePhase>('shown')

  return (
    <div className="auth-layout">
      <section className={isExiting ? 'auth-hero auth-hero--exiting' : 'auth-hero'}>
        <BrandLockup gradientId="spark-login-hero-grad" />
        <p className="auth-hero__title">{t('heroTitle')}</p>
        <p className="auth-hero__subtitle">{t('heroSubtitle')}</p>
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
            <BrandLockup gradientId="spark-login-grad" />
            <p className="auth-brand__tagline">{t('tagline')}</p>
          </div>

          <section
            className={isExiting ? 'auth-card auth-card--exiting' : 'auth-card'}
            aria-labelledby="login-title"
          >
            <h1 id="login-title" className="h-heading auth-card__title">
              {t('title')}
            </h1>

            {notice && noticePhase !== 'gone' ? (
              <p
                className={`auth-note auth-note--${notice.tone}${noticePhase === 'leaving' ? ' auth-note--leaving' : ''}`}
                role="status"
                onAnimationEnd={(event) => {
                  if (noticePhase === 'leaving' && event.target === event.currentTarget) {
                    setNoticePhase('gone')
                  }
                }}
              >
                {t(notice.messageKey)}
              </p>
            ) : null}

            <LoginForm
              from={from}
              onLoginSuccess={triggerExit}
              onEmailActivity={() =>
                setNoticePhase((phase) => (phase === 'shown' ? 'leaving' : phase))
              }
            />
          </section>
          <LegalFooterLinks />
        </div>
      </div>
    </div>
  )
}
