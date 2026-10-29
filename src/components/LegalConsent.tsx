'use client'

import { useId, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { LegalVersions } from '@spark/types'
import { legalUrl } from '@/lib/legal-links'

/**
 * The consent checkbox for the Terms of Use and Privacy Policy. Never pre-ticked. The
 * versions the person was shown travel as hidden fields so the server records what was
 * displayed, not whatever is current when the form is submitted.
 */
export function LegalConsent({
  versions,
  disabled,
  invalid,
}: {
  versions: LegalVersions
  disabled?: boolean
  invalid?: boolean
}) {
  const t = useTranslations('legal')
  const locale = useLocale()
  const id = useId()
  // Controlled: React 19 resets uncontrolled fields when a form action resolves, which would
  // silently untick the box after any failed submit.
  const [checked, setChecked] = useState(false)

  return (
    <div className="field field--consent">
      <label className="consent" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          name="legalAccepted"
          value="yes"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          required
          disabled={disabled}
          aria-invalid={invalid ? true : undefined}
        />
        <span>
          {t.rich('consent', {
            terms: (chunks) => (
              <a href={legalUrl(locale, 'terms')} target="_blank" rel="noopener noreferrer">
                {chunks}
              </a>
            ),
            privacy: (chunks) => (
              <a href={legalUrl(locale, 'privacy')} target="_blank" rel="noopener noreferrer">
                {chunks}
              </a>
            ),
          })}
        </span>
      </label>
      <input type="hidden" name="termsVersion" value={versions.terms} />
      <input type="hidden" name="privacyVersion" value={versions.privacy} />
    </div>
  )
}

export function LegalFooterLinks() {
  const t = useTranslations('legal')
  const locale = useLocale()

  return (
    <nav className="legal-links" aria-label={t('linksLabel')}>
      <a href={legalUrl(locale, 'terms')} target="_blank" rel="noopener noreferrer">
        {t('termsName')}
      </a>
      <span aria-hidden="true">·</span>
      <a href={legalUrl(locale, 'privacy')} target="_blank" rel="noopener noreferrer">
        {t('privacyName')}
      </a>
    </nav>
  )
}
