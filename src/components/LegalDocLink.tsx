'use client'

import { useEffect, useRef, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLocale, useTranslations } from 'next-intl'
import { ExternalLink, X } from 'lucide-react'
import type { LegalDocument } from '@spark/types'
import { legalUrl } from '@/lib/legal-links'

function LegalViewer({
  document: legalDocument,
  onClose,
}: {
  document: LegalDocument
  onClose: () => void
}) {
  const t = useTranslations('legal')
  const locale = useLocale()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const url = legalUrl(locale, legalDocument)
  const name = legalDocument === 'terms' ? t('termsName') : t('privacyName')

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return createPortal(
    <dialog
      ref={dialogRef}
      className="legal-viewer"
      aria-label={name}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="legal-viewer__head">
        <h2 className="legal-viewer__title">{name}</h2>
        <a className="legal-viewer__external" href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={14} aria-hidden="true" />
          {t('openInNewTab')}
        </a>
        <button
          type="button"
          className="legal-viewer__close"
          onClick={onClose}
          aria-label={t('close')}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <iframe
        className="legal-viewer__frame"
        src={url}
        title={name}
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </dialog>,
    globalThis.document.body,
  )
}

/**
 * A legal-document link that opens the page in an in-app dialog instead of a new tab, so a
 * person mid-sign-up or mid-acceptance never loses their place. The href stays real: a
 * modified click (new tab, new window) and any failure of the dialog still reach the page.
 */
export function LegalDocLink({
  document: legalDocument,
  className,
  children,
}: {
  document: LegalDocument
  className?: string
  children: ReactNode
}) {
  const locale = useLocale()
  const [open, setOpen] = useState(false)

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return
    }
    event.preventDefault()
    setOpen(true)
  }

  return (
    <>
      <a
        href={legalUrl(locale, legalDocument)}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={handleClick}
      >
        {children}
      </a>
      {open ? <LegalViewer document={legalDocument} onClose={() => setOpen(false)} /> : null}
    </>
  )
}
