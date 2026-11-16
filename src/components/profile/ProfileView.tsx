'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { DETAILS_ID, IdentityCard } from './IdentityCard'
import { DetailsCard } from './DetailsCard'
import { PasswordCard } from './PasswordCard'
import { useToast } from './Toast'

interface ProfileViewProps {
  email: string
  initialName: string
  roleLabel: string
}

/**
 * Owns what the cards share: the saved name, the name as it is being typed (so the identity
 * card follows keystrokes), and the toast. Each card still owns its own form.
 */
export function ProfileView({ email, initialName, roleLabel }: ProfileViewProps) {
  const t = useTranslations('profile')
  const nameRef = useRef<HTMLInputElement>(null)
  const [savedName, setSavedName] = useState(initialName)
  const [draft, setDraft] = useState(initialName)
  const { show, toast } = useToast()

  const handleSaved = useCallback(
    (name: string) => {
      setSavedName(name)
      show(t('toastSaved'))
    },
    [show, t],
  )

  return (
    <>
      <div className="pf">
        <IdentityCard
          draftName={draft}
          savedName={savedName}
          email={email}
          roleLabel={roleLabel}
          onAddName={() => {
            document.getElementById(DETAILS_ID)?.scrollIntoView({ block: 'start' })
            nameRef.current?.focus({ preventScroll: true })
          }}
        />
        <div className="pf-col">
          <DetailsCard
            email={email}
            savedName={savedName}
            draft={draft}
            onDraftChange={setDraft}
            onSaved={handleSaved}
            nameRef={nameRef}
          />
          <PasswordCard email={email} onToast={show} />
        </div>
      </div>
      {toast}
    </>
  )
}
