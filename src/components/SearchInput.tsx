'use client'

import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Spinner } from './Spinner'
import { useDebouncedCallback } from '@/lib/use-debounced-callback'

interface Props {
  param?: string
  placeholder?: string
  resetParams?: string[]
  delay?: number
}

export function SearchInput({ param = 'q', placeholder = 'Search…', resetParams = ['skip'], delay = 350 }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const commit = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) params.set(param, term)
    else params.delete(param)
    for (const r of resetParams) params.delete(r)
    const qs = params.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }, delay)

  return (
    <div className="search-field">
      <Search size={16} strokeWidth={2} className="search-field__icon" aria-hidden="true" />
      <input
        className="input search-field__input"
        type="search"
        defaultValue={searchParams.get(param) ?? ''}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => commit(e.target.value)}
      />
      {isPending ? <Spinner size={15} className="search-field__spinner" /> : null}
    </div>
  )
}
