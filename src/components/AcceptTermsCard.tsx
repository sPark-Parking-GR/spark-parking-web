'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { LegalDocument, LegalVersions } from '@spark/types'
import { acceptLegalAction } from '@/lib/legal-actions'
import { signOutAction } from '@/lib/auth-actions'
import { legalUrl } from '@/lib/legal-links'
import { readLegalFields } from '@/lib/legal-schema'
import { LegalConsent } from './LegalConsent'
import { SparkMark } from './SparkMark'

type State = { error: string | null }

/**
 * Shown to a signed-in account when a document's major version changed since it last
 * accepted. Lists what changed, links to the full text, and offers sign-out as the
 * alternative to accepting — declining is a real option, not a dead end.
 */
export function AcceptTermsCard({
  versions,
  required,
}: {
  versions: LegalVersions
  required: LegalDocument[]
}) {
  const t = useTranslations('legal')
  const locale = useLocale()
  const router = useRouter()

  const [state, formAction, isPending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const fields = readLegalFields(formData)
      if (!fields.legalAccepted) return { error: t('required') }

      const result = await acceptLegalAction({
        terms: fields.termsVersion,
        privacy: fields.privacyVersion,
      })
      if (!result.ok) {
        if (result.errorKey === 'authRequired') {
          router.replace('/login')
          return { error: null }
        }
        if (result.errorKey === 'stale') {
          router.refresh()
          return { error: t('stale') }
        }
        return { error: t('genericError') }
      }
      router.replace('/dashboard')
      return { error: null }
    },
    { error: null },
  )

  return (
    <div className="auth-stack">
      <div className="auth-brand">
        <span className="auth-brand__lockup">
          <SparkMark size={34} className="brand-lockup__mark" gradientId="spark-terms-grad" />
          <Image
            src="/sPark_title.png"
            alt="sPark"
            width={302}
            height={72}
            priority
            className="auth-brand__title"
          />
        </span>
      </div>

      <section className="auth-card" aria-labelledby="accept-terms-title">
        <h1 id="accept-terms-title" className="h-heading auth-card__title">
          {t('updatedTitle')}
        </h1>
        <p className="auth-card__context">{t('updatedMessage')}</p>
        <ul className="legal-changes">
          {required.map((document) => (
            <li key={document}>
              <a href={legalUrl(locale, document)} target="_blank" rel="noopener noreferrer">
                {document === 'terms' ? t('termsName') : t('privacyName')}
              </a>
            </li>
          ))}
        </ul>

        <form action={formAction} className="auth-form" noValidate>
          <LegalConsent versions={versions} disabled={isPending} invalid={Boolean(state.error)} />

          {state.error ? (
            <p className="auth-alert" role="alert">
              {state.error}
            </p>
          ) : null}

          <button type="submit" className="btn btn--primary btn--block" disabled={isPending}>
            {isPending ? t('accepting') : t('acceptAndContinue')}
          </button>
        </form>

        <form action={signOutAction}>
          <button type="submit" className="btn btn--ghost btn--block">
            {t('signOutInstead')}
          </button>
        </form>
      </section>
    </div>
  )
}
