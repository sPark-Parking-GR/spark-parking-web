import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'
import { SparkMark } from '@/components/SparkMark'

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params
  const t = await getTranslations('resetPassword')

  return (
    <div className="auth-stack">
      <div className="auth-brand">
        <span className="auth-brand__lockup">
          <SparkMark size={34} className="brand-lockup__mark" gradientId="spark-reset-grad" />
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

      <section className="auth-card" aria-labelledby="reset-password-title">
        <h1 id="reset-password-title" className="h-heading auth-card__title">
          {t('title')}
        </h1>

        <ResetPasswordForm token={token} />
      </section>
    </div>
  )
}
