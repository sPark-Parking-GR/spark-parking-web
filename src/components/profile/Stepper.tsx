import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

export type StepNumber = 1 | 2 | 3

const STEPS = [
  { n: 1, key: 'confirm' },
  { n: 2, key: 'email' },
  { n: 3, key: 'choose' },
] as const

/**
 * Presentational only: the page that owns the flow says which step is current. The reset-link
 * page reuses it with step three current, so it carries its own colour fallbacks for the auth
 * shell, where the dashboard tokens do not exist.
 */
export function Stepper({ current }: { current: StepNumber }) {
  const t = useTranslations('profile.security')

  return (
    <div className="pf-stepper">
      <ol className="pf-steps" aria-label={t('stepsLabel')}>
        {STEPS.map(({ n, key }) => {
          const state = current > n ? 'done' : current === n ? 'cur' : 'todo'
          return (
            <li
              key={n}
              className={`pf-step pf-step--${state}`}
              aria-current={state === 'cur' ? 'step' : undefined}
            >
              <span className="pf-step__dot" aria-hidden="true">
                {state === 'done' ? <Check size={16} strokeWidth={2.6} /> : n}
              </span>
              <span className="pf-step__text">
                {state === 'done' ? <span className="pf-sr">{t('stepDone')} </span> : null}
                {t(`steps.${key}`)}
              </span>
              {n < 3 ? <span className="pf-step__line" aria-hidden="true" /> : null}
            </li>
          )
        })}
      </ol>
      <p className="pf-steps-cap">{t('stepOf', { current, total: 3 })}</p>
    </div>
  )
}
