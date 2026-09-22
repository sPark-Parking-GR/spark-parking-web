import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SparkMark } from '@/components/SparkMark'

/**
 * Next's built-in 404 is an unstyled black-on-white page with no way back into the product.
 * It is reached more often than a stray URL would suggest: every cross-tenant id resolves
 * here too, because a facility belonging to someone else is deliberately reported as
 * missing rather than forbidden. Someone following a stale link deserves the door, not a
 * dead end.
 */
export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <main className="auth-shell">
      <div className="auth-stack">
        <section className="auth-card" aria-labelledby="not-found-title">
          <span className="not-found__mark">
            <SparkMark size={40} gradientId="spark-not-found-grad" />
          </span>
          <h1 id="not-found-title" className="h-heading auth-card__title">
            {t('title')}
          </h1>
          <p className="auth-card__context">{t('message')}</p>
          <p className="auth-card__forgot">
            <Link href="/dashboard">{t('backToDashboard')}</Link>
          </p>
        </section>
      </div>
    </main>
  )
}
