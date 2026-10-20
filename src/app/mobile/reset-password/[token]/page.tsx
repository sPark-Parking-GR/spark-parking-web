import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { MobileResetPasswordForm } from '@/components/MobileResetPasswordForm'
import { SparkMark } from '@/components/SparkMark'

interface MobileResetPasswordPageProps {
  params: Promise<{ token: string }>
}

export default async function MobileResetPasswordPage({ params }: MobileResetPasswordPageProps) {
  const { token } = await params
  const t = await getTranslations('mobileResetPassword')

  return (
    <div className="auth-stack">
      <div className="auth-brand">
        <span className="auth-brand__lockup">
          <SparkMark
            size={34}
            className="brand-lockup__mark"
            gradientId="spark-mobile-reset-grad"
          />
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

      <section className="auth-card" aria-labelledby="mobile-reset-password-title">
        <h1 id="mobile-reset-password-title" className="h-heading auth-card__title">
          {t('title')}
        </h1>

        <MobileResetPasswordForm token={token} />
      </section>
    </div>
  )
}
