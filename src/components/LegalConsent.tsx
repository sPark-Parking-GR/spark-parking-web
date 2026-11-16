'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { LegalVersions } from '@spark/types'
import { LegalDocLink } from './LegalDocLink'

/**
 * The consent checkbox for the Terms of Use and Privacy Policy. Never pre-ticked. The
 * versions the person was shown travel as hidden fields so the server records what was
 * displayed, not whatever is current when the form is submitted.
 */
export function LegalConsent({
  versions,
  disabled,
  invalid,
  describedBy,
  onCheckedChange,
}: {
  versions: LegalVersions
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  onCheckedChange?: (checked: boolean) => void
}) {
  const t = useTranslations('legal')
  const id = useId()
  // Controlled: React 19 resets uncontrolled fields when a form action resolves, which would
  // silently untick the box after any failed submit.
  const [checked, setChecked] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Controlled is not enough on its own: the form reset also clears the DOM checkbox (it has
  // no `checked` attribute to fall back to), so the property is re-applied after each render.
  useEffect(() => {
    if (inputRef.current && inputRef.current.checked !== checked) {
      inputRef.current.checked = checked
    }
  })

  return (
    <div className="field field--consent">
      <label className="consent" htmlFor={id}>
        <input
          ref={inputRef}
          id={id}
          type="checkbox"
          name="legalAccepted"
          value="yes"
          checked={checked}
          onChange={(event) => {
            setChecked(event.target.checked)
            onCheckedChange?.(event.target.checked)
          }}
          required
          disabled={disabled}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
        />
        <span>
          {t.rich('consent', {
            terms: (chunks) => <LegalDocLink document="terms">{chunks}</LegalDocLink>,
            privacy: (chunks) => <LegalDocLink document="privacy">{chunks}</LegalDocLink>,
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

  return (
    <nav className="legal-links" aria-label={t('linksLabel')}>
      <LegalDocLink document="terms">{t('termsName')}</LegalDocLink>
      <span aria-hidden="true">·</span>
      <LegalDocLink document="privacy">{t('privacyName')}</LegalDocLink>
    </nav>
  )
}
