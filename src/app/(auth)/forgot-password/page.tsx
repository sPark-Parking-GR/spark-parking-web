import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm'
import { SparkMark } from '@/components/SparkMark'

export default async function ForgotPasswordPage() {
  const t = await getTranslations('forgotPassword')

  return (
    <div className="auth-stack">
      <div className="auth-brand">
        <span className="auth-brand__lockup">
          <SparkMark size={34} className="brand-lockup__mark" gradientId="spark-forgot-grad" />
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

      <section className="auth-card" aria-labelledby="forgot-password-title">
        <h1 id="forgot-password-title" className="h-heading auth-card__title">
          {t('title')}
        </h1>
        <p className="auth-card__context">{t('subtitle')}</p>

        <ForgotPasswordForm />
      </section>
    </div>
  )
}
