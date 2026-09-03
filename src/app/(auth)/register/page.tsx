import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { RegisterOperatorForm } from '@/components/RegisterOperatorForm'
import { SparkMark } from '@/components/SparkMark'
import { checkRegisterAvailabilityAction } from '@/lib/operator-registration-actions'

export default async function RegisterOperatorPage() {
  const t = await getTranslations('registerOperator')
  const { enabled } = await checkRegisterAvailabilityAction()

  return (
    <div className="auth-stack">
      <div className="auth-brand">
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

      <section className="auth-card" aria-labelledby="register-operator-title">
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
            <RegisterOperatorForm />
          </>
        )}
      </section>
    </div>
  )
}
