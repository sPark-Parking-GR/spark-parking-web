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
        width: 36,
        height: 36,
        borderRadius: 'var(--pill)',
        border: '1px solid var(--line)',
        background: 'var(--surface)',
        color: 'var(--ink)',
        cursor: 'pointer',
      }}
    >
      {mode === 'dark' ? '☀' : '☾'}
    </button>
  )
}
