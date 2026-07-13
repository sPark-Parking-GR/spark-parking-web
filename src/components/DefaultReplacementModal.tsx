'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'

export interface DefaultReplacementCandidate {
  id: string
  name: string
}

interface Props {
  open: boolean
  onClose: () => void
  candidates: DefaultReplacementCandidate[]
  pending: boolean
  error: string | null
  onConfirm: (newDefaultPlanId: string) => void
}

export function DefaultReplacementModal({
  open,
  onClose,
  candidates,
  pending,
  error,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<string>(candidates[0]?.id ?? '')
  const t = useTranslations('tariffs.defaultReplacement')

  return (
    <Modal open={open} onClose={onClose} title={t('title')}>
      <p className="modal__text">{t('body')}</p>

      {error ? (
        <div className="form-banner form-banner--error" role="alert">
          {error}
        </div>
      ) : null}

      {candidates.length === 0 ? (
        <div className="form-banner form-banner--warning" role="status">
          {t('noCandidates')}
        </div>
      ) : (
        <div className="field">
          <span className="field__label">{t('label')}</span>
          <select
            className="input"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={pending}
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="modal__footer">
        <button type="button" className="btn btn--secondary" onClick={onClose} disabled={pending}>
          {t('cancel')}
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={pending || candidates.length === 0 || !selected}
          onClick={() => onConfirm(selected)}
        >
          {pending ? (
            <>
              <Spinner size={15} />
              {t('saving')}
            </>
          ) : (
            t('confirm')
          )}
        </button>
      </div>
    </Modal>
  )
}
