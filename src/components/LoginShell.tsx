'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'

import { LoginForm } from './LoginForm'
import { SparkMark } from './SparkMark'

// Must match the exit animation durations in globals.css (slideUpOut + fadeOutScale = 380ms).
const EXIT_ANIMATION_DURATION_MS = 380

interface LoginShellProps {
  from?: string
  error?: 'forbidden' | 'restricted'
  reset?: 'success'
  linked?: 'success'
}

/**
 * Full login-page shell as a client component so that both the auth-brand and
 * the auth-card can respond to the same `isExiting` state.
 *
 * Entrance  – brand slides down from above while card scales up (simultaneous).
 * Exit      – brand slides back up while card scales down (simultaneous), then
 *             the router navigates to the dashboard once both finish.
 */
export function LoginShell({ from, error, reset, linked }: LoginShellProps) {
  const t = useTranslations('login')
  const router = useRouter()
  const [isExiting, setIsExiting] = useState(false)

  const handleLoginSuccess = useCallback(
    (redirectTo: string) => {
      setIsExiting(true)
      setTimeout(() => {
        router.push(redirectTo)
      }, EXIT_ANIMATION_DURATION_MS)
    },
    [router],
  )

  return (
    <div className="auth-stack">
      {/* Brand – entrance: slideDown, exit: slideUpOut */}
      <div className={isExiting ? 'auth-brand auth-brand--exiting' : 'auth-brand'}>
        <span className="auth-brand__lockup">
          <SparkMark size={34} className="brand-lockup__mark" gradientId="spark-login-grad" />
          <Image
            src="/sPark_title.png"
            alt="sPark"
            width={302}
            height={72}
            priority
            className="auth-brand__title"
          />
        </span>
        <p className="auth-brand__tagline">{t('tagline')}</p>
      </div>

      {/* Card – entrance: fadeInScale, exit: fadeOutScale */}
      <section
        className={isExiting ? 'auth-card auth-card--exiting' : 'auth-card'}
        aria-labelledby="login-title"
      >
        <h1 id="login-title" className="h-heading auth-card__title">
          {t('title')}
        </h1>

        {error === 'forbidden' ? (
          <p className="auth-alert" role="alert">
            {t('forbiddenMessage')}
          </p>
        ) : null}
        {error === 'restricted' ? (
          <p className="auth-alert" role="alert">
            {t('restrictedMessage')}
          </p>
        ) : null}
        {reset === 'success' ? (
          <p className="auth-card__context" role="status">
            {t('resetSuccess')}
          </p>
        ) : null}
        {linked === 'success' ? (
          <p className="auth-card__context" role="status">
            {t('accountLinked')}
          </p>
        ) : null}

        <LoginForm from={from} onLoginSuccess={handleLoginSuccess} />
      </section>
    </div>
  )
}

