'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

/**
 * Advisory only. It never blocks a submit and the server never sees the score — the policy
 * remains a length floor, and this exists so someone choosing "password123" is told it is
 * guessable rather than congratulated for clearing eight characters.
 *
 * The dictionary is a few hundred kilobytes, so it is imported dynamically and only once
 * somebody actually starts typing a password. Loading it eagerly would put it in the bundle
 * of every page that renders a form.
 */
let enginePromise: Promise<(password: string) => number> | null = null

function loadEngine(): Promise<(password: string) => number> {
  enginePromise ??= (async () => {
    const [{ ZxcvbnFactory }, common] = await Promise.all([
      import('@zxcvbn-ts/core'),
      import('@zxcvbn-ts/language-common'),
    ])
    const engine = new ZxcvbnFactory({
      dictionary: common.dictionary,
      graphs: common.adjacencyGraphs,
    })
    return (password: string) => engine.check(password).score
  })()
  return enginePromise
}

const LABEL_KEYS = ['veryWeak', 'weak', 'fair', 'good', 'strong'] as const

export function PasswordStrengthMeter({ password }: { password: string }) {
  const t = useTranslations('password')
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    if (password === '') {
      setScore(null)
      return
    }
    // Guards against an out-of-order result overwriting a newer one: the dictionary load
    // resolves on the first keystroke, long after several more have been typed.
    let cancelled = false
    void loadEngine().then((score) => {
      if (!cancelled) setScore(score(password))
    })
    return () => {
      cancelled = true
    }
  }, [password])

  if (score === null) return null

  return (
    <div className="password-meter">
      <div
        className="password-meter__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
        aria-label={t('meterLabel')}
      >
        <div className="password-meter__fill" data-score={score} />
      </div>
      {/* Polite, not assertive: this updates on every keystroke and must not interrupt
          someone mid-word. */}
      <p className="password-meter__label" aria-live="polite">
        {t(`strength.${LABEL_KEYS[score]}`)}
      </p>
    </div>
  )
}
