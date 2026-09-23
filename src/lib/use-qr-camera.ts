'use client'

import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

const DECODE_INTERVAL_MS = 250
const MAX_DECODE_WIDTH = 480

export type CameraStatus = 'starting' | 'active' | 'error'

export type CameraErrorKey =
  'insecureContext' | 'unsupported' | 'permissionDenied' | 'notFound' | 'unknown'

function mapGetUserMediaError(err: unknown): CameraErrorKey {
  const name = err instanceof DOMException ? err.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'permissionDenied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'notFound'
  return 'unknown'
}

export function useQrCamera(onDecode: (value: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const onDecodeRef = useRef(onDecode)
  onDecodeRef.current = onDecode

  const [status, setStatus] = useState<CameraStatus>('starting')
  const [errorKey, setErrorKey] = useState<CameraErrorKey | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.isSecureContext) {
      setStatus('error')
      setErrorKey('insecureContext')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setErrorKey('unsupported')
      return
    }

    const video = videoRef.current
    let cancelled = false
    canvasRef.current = document.createElement('canvas')

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (video) {
          video.srcObject = stream
          void video.play().catch(() => undefined)
        }
        setStatus('active')
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatus('error')
          setErrorKey(mapGetUserMediaError(err))
        }
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (video) video.srcObject = null
    }
  }, [])

  useEffect(() => {
    if (status !== 'active') return

    const tick = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) return
      if (video.videoWidth === 0 || video.videoHeight === 0) return

      const scale = Math.min(1, MAX_DECODE_WIDTH / video.videoWidth)
      const width = Math.max(1, Math.round(video.videoWidth * scale))
      const height = Math.max(1, Math.round(video.videoHeight * scale))
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      canvas.width = width
      canvas.height = height
      ctx.drawImage(video, 0, 0, width, height)
      const frame = ctx.getImageData(0, 0, width, height)
      const code = jsQR(frame.data, width, height, { inversionAttempts: 'dontInvert' })
      if (code?.data) onDecodeRef.current(code.data)
    }

    const interval = setInterval(tick, DECODE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [status])

  return { videoRef, status, errorKey }
}
