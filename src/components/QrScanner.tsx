'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Volume2, VolumeX } from 'lucide-react'
import { ManualCodeForm } from './ManualCodeForm'
import { ScanResultPanel } from './ScanResultPanel'
import { useQrCamera } from '@/lib/use-qr-camera'
import { useScanAudio } from '@/lib/use-scan-audio'
import { verifyQrAction } from '@/lib/scan-actions'
import type { VerifyQrActionInput, VerifyQrActionResult } from '@/lib/scan-actions'

const RESUBMIT_DEBOUNCE_MS = 4000

export function QrScanner() {
  const t = useTranslations('scan')
  const [result, setResult] = useState<VerifyQrActionResult | null>(null)
  const [pending, setPending] = useState(false)
  const lastSubmissionRef = useRef<{ key: string; at: number } | null>(null)
  const pendingRef = useRef(false)
  const { playSuccess, playWarn, playError, muted, toggleMuted } = useScanAudio()

  const submit = useCallback(
    async (input: VerifyQrActionInput, dedupeKey: string) => {
      if (pendingRef.current) return
      pendingRef.current = true
      lastSubmissionRef.current = { key: dedupeKey, at: Date.now() }
      setPending(true)

      const outcome = await verifyQrAction(input)

      pendingRef.current = false
      setPending(false)
      setResult(outcome)

      if (!outcome.ok) {
        playError()
      } else if (outcome.result.verdict === 'valid' && outcome.result.checkIn === 'performed') {
        playSuccess()
      } else if (outcome.result.verdict === 'valid') {
        playWarn()
      } else {
        playError()
      }
    },
    [playSuccess, playWarn, playError],
  )

  const handleDecode = useCallback(
    (value: string) => {
      if (pendingRef.current) return
      const last = lastSubmissionRef.current
      if (last && last.key === value && Date.now() - last.at < RESUBMIT_DEBOUNCE_MS) return
      void submit({ payload: value }, value)
    },
    [submit],
  )

  const { videoRef, status, errorKey } = useQrCamera(handleDecode)

  const handleManualSubmit = useCallback(
    (code: string) => {
      if (pendingRef.current) return
      void submit({ accessCode: code }, `code:${code}`)
    },
    [submit],
  )

  return (
    <div className="scanner">
      <div className="panel-card">
        <h3 className="h-heading">{t('camera.heading')}</h3>
        <div className="scanner__viewport">
          <video ref={videoRef} className="scanner__video" muted playsInline autoPlay />
          {status === 'active' ? <div className="scanner__frame" aria-hidden="true" /> : null}
          {status !== 'active' ? (
            <div className="scanner__overlay">
              <p>{status === 'starting' ? t('camera.starting') : t(`camera.error.${errorKey}`)}</p>
            </div>
          ) : null}
          <button
            type="button"
            className="scanner__mute"
            onClick={toggleMuted}
            aria-pressed={muted}
            aria-label={t(muted ? 'mute.off' : 'mute.on')}
          >
            {muted ? (
              <VolumeX size={22} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Volume2 size={22} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
        {status === 'active' ? <p className="text-secondary">{t('camera.hint')}</p> : null}
      </div>

      <ScanResultPanel result={result} pending={pending} />

      <div className="panel-card">
        <h3 className="h-heading">{t('manual.heading')}</h3>
        <ManualCodeForm onSubmit={handleManualSubmit} pending={pending} />
      </div>
    </div>
  )
}
