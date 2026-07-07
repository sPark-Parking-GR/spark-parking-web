'use client'

import { useEffect, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { ThemeProvider, useTheme } from '@spark/ui'
import type { ThemeMode, ThemeOverride, ThemeStorageAdapter } from '@spark/ui'

const STORAGE_KEY = 'spark-theme'

const storage: ThemeStorageAdapter = {
  get(): ThemeOverride {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  },
  set(mode: ThemeOverride): void {
    if (mode === null) {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, mode)
    }
  },
}

function useSystemScheme(): ThemeMode {
  const [scheme, setScheme] = useState<ThemeMode>('light')

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    setScheme(query.matches ? 'dark' : 'light')

    const handleChange = (event: MediaQueryListEvent): void => {
      setScheme(event.matches ? 'dark' : 'light')
    }

    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return scheme
}

function ThemeAttributeSync({ children }: { children: ReactNode }): ReactElement {
  const { mode } = useTheme()

  useEffect(() => {
    document.documentElement.dataset.theme = mode
  }, [mode])

  return <>{children}</>
}

export function AppThemeProvider({ children }: { children: ReactNode }): ReactElement {
  const systemScheme = useSystemScheme()

  return (
    <ThemeProvider systemScheme={systemScheme} storage={storage}>
      <ThemeAttributeSync>{children}</ThemeAttributeSync>
    </ThemeProvider>
  )
}
