'use client'

import { useOptimistic, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff } from 'lucide-react'
import { updateFacilityPublishedAction } from '@/lib/facility-actions'

interface Props {
  id: string
  initialIsPublished: boolean
}

export function PublishFacilityToggle({ id, initialIsPublished }: Props) {
  const t = useTranslations('facilities')
  const router = useRouter()
  const [isPublished, setIsPublished] = useState(initialIsPublished)
  const [optimisticPublished, setOptimisticPublished] = useOptimistic(isPublished)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  // Guards against out-of-order responses: interaction stays enabled while a
  // toggle is in flight, so a later click can fire before an earlier one
  // resolves. Only the response matching the most recent click is allowed to
  // commit, so a stale one can't clobber isPublished with an outdated value.
  const latestRequestId = useRef(0)

  const label = optimisticPublished
    ? t('publishToggle.published')
    : t('publishToggle.unpublished')

  const toggle = () => {
    const next = !optimisticPublished
    const requestId = ++latestRequestId.current
    setError(null)
    startTransition(async () => {
      setOptimisticPublished(next)
      const res = await updateFacilityPublishedAction(id, next)
      if (requestId !== latestRequestId.current) return
      if (!res.ok) {
        // Transition ends without committing next, so optimisticPublished
        // falls back to isPublished (the pre-toggle value) automatically.
        setError(res.detail ?? t(res.errorKey))
        return
      }
      setIsPublished(next)
      router.refresh()
    })
  }

  return (
    <div className="publish-toggle">
      <button
        type="button"
        role="switch"
        aria-checked={optimisticPublished}
        aria-label={label}
        onClick={toggle}
        className="publish-switch"
        data-tooltip={label}
        data-tooltip-pos="bottom"
      >
        <span className="publish-switch__knob">
          {optimisticPublished ? (
            <Eye size={15} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <EyeOff size={15} strokeWidth={2.5} aria-hidden="true" />
          )}
        </span>
      </button>
      {error ? (
        <p className="form-banner form-banner--error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
