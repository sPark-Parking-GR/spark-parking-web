'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { RegisterOperatorForm } from './RegisterOperatorForm'
import { SparkMark } from './SparkMark'
import { useAuthPageExit } from '@/lib/useAuthPageExit'

/**
 * Client shell for the operator sign-up page, mirroring LoginShell: owns the
 * exit animation + page-transition cover so a successful registration hands off
 * to the dashboard the same way a successful sign-in does, instead of the plain
 * server-side redirect this page used to do (a hard cut, no exit animation).
 */
export function RegisterShell({ enabled }: { enabled: boolean }) {
  const t = useTranslations('registerOperator')
  const { isExiting, triggerExit } = useAuthPageExit()

  return (
    <div className="auth-stack">
      <div className={isExiting ? 'auth-brand auth-brand--exiting' : 'auth-brand'}>
        <span className="auth-brand__lockup">
          <SparkMark size={34} className="brand-lockup__mark" gradientId="spark-register-grad" />
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

      <section
        className={isExiting ? 'auth-card auth-card--exiting' : 'auth-card'}
        aria-labelledby="register-operator-title"
      >
        {!enabled ? (
          <>
            <h1 id="register-operator-title" className="h-heading auth-card__title">
              {t('disabledTitle')}
            </h1>
            <p className="auth-card__context">{t('disabledMessage')}</p>
            <p className="auth-card__forgot">
              <Link href="/login">{t('goToLogin')}</Link>
            </p>
          </>
        ) : (
          <>
            <h1 id="register-operator-title" className="h-heading auth-card__title">
              {t('title')}
            </h1>
            <p className="auth-card__context">{t('subtitle')}</p>
            <RegisterOperatorForm onRegisterSuccess={triggerExit} />
          </>
        )}
      </section>
    </div>
  )
}
