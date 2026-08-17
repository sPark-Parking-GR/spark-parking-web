'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Spinner } from './Spinner'

export interface TariffOperatorOption {
  id: string
  name: string
}

interface Props {
  operators: TariffOperatorOption[]
}

export function TariffOperatorFilter({ operators }: Props) {
  const t = useTranslations('tariffs')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const setOperator = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set('operatorId', value)
    else params.delete('operatorId')
    params.delete('skip')
    const qs = params.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <div className="filter-bar">
      <select
        className="input filter-bar__select"
        aria-label={t('filters.operatorAria')}
        value={searchParams.get('operatorId') ?? ''}
        onChange={(e) => setOperator(e.target.value)}
      >
        <option value="">{t('filters.allOperators')}</option>
        {operators.map((operator) => (
          <option key={operator.id} value={operator.id}>
            {operator.name}
          </option>
        ))}
      </select>
      {isPending ? <Spinner size={15} className="filter-bar__spinner" /> : null}
    </div>
  )
}
