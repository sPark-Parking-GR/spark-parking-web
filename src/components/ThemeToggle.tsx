'use client'

import type { ReactElement } from 'react'
import { useTranslations } from 'next-intl'
import { useTheme } from '@spark/ui'

export function ThemeToggle(): ReactElement {
  const { mode, toggle } = useTheme()
  const t = useTranslations('shell')

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mode === 'dark' ? t('switchToLightMode') : t('switchToDarkMode')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        borderRadius: '999px',
        border: '1px solid var(--line)',
        background: 'var(--card2)',
        color: 'var(--muted)',
        cursor: 'pointer',
      }}
    >
      {mode === 'dark' ? '☀' : '☾'}
    </button>
  )
}
