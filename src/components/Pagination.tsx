import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  skip: number
  take: number
  total: number
  buildHref: (skip: number) => string
  sticky?: boolean
}

export function Pagination({ skip, take, total, buildHref, sticky = false }: Props) {
  if (total <= take) return null

  const hasPrev = skip > 0
  const hasNext = skip + take < total
  const from = total === 0 ? 0 : skip + 1
  const to = Math.min(skip + take, total)

  return (
    <nav
      className={`pagination${sticky ? ' pagination--sticky' : ''}`}
      aria-label="Pagination"
    >
      {hasPrev ? (
        <Link href={buildHref(Math.max(0, skip - take))} className="btn btn--secondary pagination__btn">
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span className="btn btn--secondary pagination__btn pagination__btn--disabled" aria-disabled="true">
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
          Previous
        </span>
      )}
      <span className="pagination__info text-secondary">
        {from}–{to} of {total}
      </span>
      {hasNext ? (
        <Link href={buildHref(skip + take)} className="btn btn--secondary pagination__btn">
          Next
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
        </Link>
      ) : (
        <span className="btn btn--secondary pagination__btn pagination__btn--disabled" aria-disabled="true">
          Next
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
        </span>
      )}
    </nav>
  )
}
