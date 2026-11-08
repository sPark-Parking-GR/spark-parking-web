import { useTranslations } from 'next-intl'

// Length-only on purpose: the policy is a length floor, and "longer is stronger than
// complicated" is the message. 8 is acceptable, 12 good, 16 and over strong.
function levelFor(length: number): 'short' | 'ok' | 'good' | 'strong' {
  if (length >= 16) return 'strong'
  if (length >= 12) return 'good'
  if (length >= 8) return 'ok'
  return 'short'
}

const SCORE = { short: 1, ok: 2, good: 3, strong: 4 } as const

export function PasswordLengthMeter({ password }: { password: string }) {
  const t = useTranslations('password')
  if (password === '') return null
  const level = levelFor(password.length)

  return (
    <div className="password-meter">
      <div
        className="password-meter__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={SCORE[level]}
        aria-label={t('meterLabel')}
      >
        <div className="password-meter__fill" data-score={SCORE[level]} />
      </div>
      <p className="password-meter__label" aria-live="polite">
        {t(`length.${level}`)}
      </p>
    </div>
  )
}
