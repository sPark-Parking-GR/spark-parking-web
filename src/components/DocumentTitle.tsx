'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { pageTitleKeyFor } from '@/lib/page-title'

const BASE_TITLE = 'sPark Portal'

export function DocumentTitle() {
  const pathname = usePathname()
  const locale = useLocale()
  const tNav = useTranslations('nav')
  const tShell = useTranslations('shell')
  const tDoc = useTranslations('documentTitle')

  useEffect(() => {
    const target = pageTitleKeyFor(pathname)
    if (!target) {
      return
    }
    const label =
      target.namespace === 'nav'
        ? tNav(target.key)
        : target.namespace === 'shell'
          ? tShell(target.key)
          : tDoc(target.key)
    const title = `${label} · ${BASE_TITLE}`
    document.title = title

    // Next re-writes <title> from the root metadata during client navigations, which would
    // undo the page label; the observer puts it back.
    const el = document.querySelector('title')
    if (!el) {
      return
    }
    const observer = new MutationObserver(() => {
      if (document.title !== title) {
        document.title = title
      }
    })
    observer.observe(el, { childList: true, characterData: true, subtree: true })
    return () => observer.disconnect()
  }, [pathname, locale, tNav, tShell, tDoc])

  return null
}
