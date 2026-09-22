'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { isValidAccessCode, normalizeAccessCode } from '@/lib/access-code'

interface Props {
  pending: boolean
  onSubmit: (code: string) => void
}

export function ManualCodeForm({ pending, onSubmit }: Props) {
  const t = useTranslations('scan.manual')
  const [value, setValue] = useState('')
  const [invalid, setInvalid] = useState(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const normalized = normalizeAccessCode(value)
    if (!isValidAccessCode(normalized)) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    onSubmit(normalized)
  }

  return (
    <form className="scanner__manual" onSubmit={handleSubmit} noValidate>
      <label className="field">
        <span className="field__label">{t('label')}</span>
        <input
          className={`input scanner__manual-input${invalid ? ' input--error' : ''}`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (invalid) setInvalid(false)
          }}
          placeholder={t('placeholder')}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={pending}
        />
        {invalid ? <span className="field__error">{t('invalidFormat')}</span> : null}
      </label>
      <button
        type="submit"
        className="btn btn--primary btn--block scanner__manual-submit"
        disabled={pending || value.trim().length === 0}
      >
        {pending ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
