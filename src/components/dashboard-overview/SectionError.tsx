'use client'

import { RefreshCw, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { StateBlock } from './StateBlock'
import { useRefresh } from './useRouterRefresh'

interface Props {
  message?: string
  retryable?: boolean
  onRetry?: () => void
}

export function SectionError({ message, retryable = true, onRetry }: Props) {
  const t = useTranslations('dashboardStates')
  const { pending, refresh } = useRefresh()

  return (
    <StateBlock
      tone="error"
      icon={<TriangleAlert size={26} strokeWidth={1.8} />}
      title={t('errorTitle')}
      message={message ?? t('errorMessage')}
    >
      {retryable ? (
        <button
          type="button"
          className="ov-btn ov-btn--pri"
          disabled={pending}
          onClick={() => {
            onRetry?.()
            refresh()
          }}
        >
          <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
          {t('retry')}
        </button>
      ) : null}
    </StateBlock>
  )
}
