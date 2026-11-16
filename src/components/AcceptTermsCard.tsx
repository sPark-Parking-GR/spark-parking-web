'use client'

import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, ChevronRight, FileText } from 'lucide-react'
import type { LegalDocument, LegalVersions } from '@spark/types'
import { acceptLegalAction } from '@/lib/legal-actions'
import { signOutAction } from '@/lib/auth-actions'
import { readLegalFields } from '@/lib/legal-schema'
import { AuthShell } from './AuthShell'
import { FieldError } from './FieldError'
import { LegalConsent } from './LegalConsent'
import { LegalDocLink } from './LegalDocLink'
import { Spinner } from './Spinner'

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
    <AuthShell
      titleId="accept-terms-title"
      title={t('updatedTitle')}
      subtitle={t('updatedMessage')}
      tagline={t('tagline')}
      heroTitle={t('heroTitle')}
      heroSubtitle={t('heroSubtitle')}
    >
      <ul className="auth-tips auth-tips--links">
        {required.map((document) => (
          <li key={document}>
            <LegalDocLink document={document} className="auth-doc-link">
              <FileText size={16} aria-hidden="true" />
              <span>{document === 'terms' ? t('termsName') : t('privacyName')}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </LegalDocLink>
          </li>
        ))}
      </ul>

      <form action={formAction} className="auth-form" noValidate>
        <LegalConsent
          versions={versions}
          disabled={isPending}
          invalid={Boolean(state.error)}
          describedBy={state.error ? 'accept-terms-error' : undefined}
        />
        {state.error ? <FieldError id="accept-terms-error">{state.error}</FieldError> : null}

        <button
          type="submit"
          className="btn btn--primary btn--block auth-submit"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? <Spinner size={16} /> : null}
          {isPending ? t('accepting') : t('acceptAndContinue')}
          {isPending ? null : <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />}
        </button>
      </form>

      <form action={signOutAction}>
        <button type="submit" className="auth-link-button auth-signout">
          {t('signOutInstead')}
        </button>
      </form>
    </AuthShell>
  )
}
