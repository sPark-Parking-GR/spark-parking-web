'use client'

import { useOptimistic, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff } from 'lucide-react'
import { updateFacilityLiveAction } from '@/lib/facility-actions'

interface Props {
  id: string
  initialIsActive: boolean
  initialIsPublished: boolean
}

export function PublishFacilityToggle({ id, initialIsActive, initialIsPublished }: Props) {
  const t = useTranslations('facilities')
  const router = useRouter()
  const [isLive, setIsLive] = useState(initialIsActive && initialIsPublished)
  const [optimisticLive, setOptimisticLive] = useOptimistic(isLive)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  // Guards against out-of-order responses: interaction stays enabled while a
  // toggle is in flight, so a later click can fire before an earlier one
  // resolves. Only the response matching the most recent click is allowed to
  // commit, so a stale one can't clobber isLive with an outdated value.
  const latestRequestId = useRef(0)

  const label = optimisticLive ? t('publishToggle.live') : t('publishToggle.notLive')

  const toggle = () => {
    const next = !optimisticLive
    const requestId = ++latestRequestId.current
    setError(null)
    startTransition(async () => {
      setOptimisticLive(next)
      const res = await updateFacilityLiveAction(id, next)
      if (requestId !== latestRequestId.current) return
      if (!res.ok) {
        // Transition ends without committing next, so optimisticLive
        // falls back to isLive (the pre-toggle value) automatically.
        setError(res.detail ?? t(res.errorKey))
        return
      }
      setIsLive(next)
      router.refresh()
    })
  }

  return (
    <div className="publish-toggle">
      <button
        type="button"
        role="switch"
        aria-checked={optimisticLive}
        aria-label={label}
        onClick={toggle}
        className="publish-switch"
        data-tooltip={label}
        data-tooltip-pos="bottom"
      >
        <span className="publish-switch__knob">
          {optimisticLive ? (
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
