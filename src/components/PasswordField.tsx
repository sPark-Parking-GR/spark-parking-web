'use client'

import { useState } from 'react'
import type { KeyboardEvent, Ref } from 'react'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, LockKeyhole, TriangleAlert } from 'lucide-react'
import { FloatingInput } from '@/components/FloatingInput'
import { PasswordLengthMeter } from '@/components/PasswordLengthMeter'

interface PasswordFieldProps {
  id: string
  name: string
  label: string
  autoComplete: 'current-password' | 'new-password'
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  autoFocus?: boolean
  error?: string | null
  // Marks the field invalid when a banner, not the field, carries the message.
  invalid?: boolean
  describedBy?: string
  hint?: string
  showStrength?: boolean
  ref?: Ref<HTMLInputElement>
}

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  value,
  onChange,
  onBlur,
  disabled,
  autoFocus,
  error,
  invalid,
  describedBy,
  hint,
  showStrength,
  ref,
}: PasswordFieldProps) {
  const t = useTranslations('login')
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const errorId = `${id}-error`
  const capsId = `${id}-caps`
  const hintId = `${id}-hint`

  const described =
    [error ? errorId : null, describedBy ?? null, hint ? hintId : null, capsLock ? capsId : null]
      .filter((part): part is string => part !== null)
      .join(' ') || undefined

  const handleCaps = (event: KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(event.getModifierState('CapsLock'))

  return (
    <div className="field">
      <FloatingInput
        ref={ref}
        id={id}
        label={label}
        icon={<LockKeyhole size={18} strokeWidth={2} />}
        type={visible ? 'text' : 'password'}
        name={name}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleCaps}
        onKeyUp={handleCaps}
        onBlur={() => {
          setCapsLock(false)
          onBlur?.()
        }}
        aria-invalid={error || invalid ? true : undefined}
        aria-describedby={described}
        trailing={
          <button
            type="button"
            className="pw-input__toggle"
            onClick={() => setVisible((shown) => !shown)}
            aria-label={visible ? t('hidePassword') : t('showPassword')}
            aria-pressed={visible}
            disabled={disabled}
          >
            {visible ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>
        }
      />
      {error ? (
        <p id={errorId} className="field__error auth-field-error" role="alert">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      ) : null}
      {showStrength ? <PasswordLengthMeter password={value} /> : null}
      {capsLock ? (
        <p id={capsId} className="auth-field-hint" role="status">
          <TriangleAlert size={14} strokeWidth={2.25} aria-hidden="true" />
          {t('capsLockOn')}
        </p>
      ) : null}
    </div>
  )
}
