import { Check, Circle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PASSWORD_MIN } from '@spark/types'

/**
 * The policy is a length floor and nothing else (see vendor/types password.ts), so that is the
 * one live check. A "passwords match" line only appears where there is a second field to match.
 */
export function PasswordRules({ password }: { password: string }) {
  const t = useTranslations('password.rules')
  const ok = password.length >= PASSWORD_MIN

  return (
    <ul className="pf-rules">
      <li className={ok ? 'pf-rules__ok' : undefined}>
        {ok ? (
          <Check size={14} strokeWidth={2.6} aria-hidden="true" />
        ) : (
          <Circle size={14} strokeWidth={2.2} aria-hidden="true" />
        )}
        {t('minLength', { min: PASSWORD_MIN })}
      </li>
    </ul>
  )
}
