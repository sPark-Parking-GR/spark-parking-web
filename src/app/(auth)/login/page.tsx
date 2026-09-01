import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { LoginForm } from '@/components/LoginForm'
import { SparkMark } from '@/components/SparkMark'

interface LoginPageProps {
  searchParams: Promise<{
    from?: string
    error?: 'forbidden' | 'restricted'
    reset?: 'success'
    linked?: 'success'
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { from, error, reset, linked } = await searchParams
  const t = await getTranslations('login')

  return (
    <div className="auth-stack">
      <div className="auth-brand">
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

      <section className="auth-card" aria-labelledby="login-title">
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

        <LoginForm from={from} />
      </section>
    </div>
  )
}
