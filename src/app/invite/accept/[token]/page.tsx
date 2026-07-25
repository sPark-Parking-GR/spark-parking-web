import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SparkMark } from '@/components/SparkMark'
import { SetPasswordForm } from '@/components/SetPasswordForm'
import { validateInviteAction } from '@/lib/invite-actions'

interface AcceptInvitePageProps {
  params: Promise<{ token: string }>
}

export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token } = await params
  const t = await getTranslations('acceptInvite')
  const result = await validateInviteAction(token)

  return (
    <div className="auth-stack">
      <div className="auth-brand">
        <span className="auth-brand__lockup">
          <SparkMark size={34} className="brand-lockup__mark" gradientId="spark-invite-grad" />
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

      <section className="auth-card" aria-labelledby="accept-invite-title">
        {!result.ok ? (
          <>
            <h1 id="accept-invite-title" className="h-heading auth-card__title">
              {t('invalidTitle')}
            </h1>
            <p className="auth-alert" role="alert">
              {result.status === 404 ? t('invalidMessage') : t('invalidGenericMessage')}
            </p>
            <p className="auth-card__forgot">
              <Link href="/login">{t('goToLogin')}</Link>
            </p>
          </>
        ) : result.data.expired ? (
          <>
            <h1 id="accept-invite-title" className="h-heading auth-card__title">
              {t('expiredTitle')}
            </h1>
            <p className="auth-alert" role="alert">
              {t('expiredMessage')}
            </p>
          </>
        ) : (
          <>
            <h1 id="accept-invite-title" className="h-heading auth-card__title">
              {t('title')}
            </h1>
            <p className="auth-card__context">
              {t.rich('context', {
                businessName: result.data.businessName,
                b: (chunks) => <strong>{chunks}</strong>,
                email: result.data.email,
              })}
            </p>
            <SetPasswordForm token={token} />
          </>
        )}
      </section>
    </div>
  )
}
