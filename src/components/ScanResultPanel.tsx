'use client'

import { useTranslations } from 'next-intl'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, CheckCircle2, ScanLine, XCircle } from 'lucide-react'
import { formatBookingDate, titleCase } from '@/lib/booking-format'
import type { ScanErrorKey, VerifyQrActionResult } from '@/lib/scan-actions'
import type { CheckInOutcome, TicketVerdict } from '@/lib/scan-api'

type Tone = 'ok' | 'warn' | 'bad'

const TONE_ICON: Record<Tone, LucideIcon> = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  bad: XCircle,
}

// A booking scanned at another operator's facility gets the identical 404 as one that
// doesn't exist at all — see TicketNotFoundError in the API. There is deliberately no
// "wrong facility" verdict here: adding one back would let a scanning operator learn that
// a code is valid somewhere on the platform, the exact existence oracle the API avoids.
function toneForVerdict(verdict: TicketVerdict, checkIn: CheckInOutcome | null): Tone {
  switch (verdict) {
    case 'valid':
      return checkIn === 'performed' ? 'ok' : 'warn'
    case 'outside_time_window':
      return 'warn'
    default:
      return 'bad'
  }
}

// Redis being unreachable is a working fallback (manual access code), not a dead end, so
// it gets the same cautionary tone as an expired code rather than a hard failure.
function toneForError(errorKey: ScanErrorKey): Tone {
  return errorKey === 'redisUnavailable' ? 'warn' : 'bad'
}

function messagePathFor(result: VerifyQrActionResult): string {
  if (!result.ok) return `errors.${result.errorKey}`

  const { verdict, checkIn } = result.result
  if (verdict === 'valid') {
    switch (checkIn) {
      case 'performed':
        return 'verdict.checkedIn'
      case 'already_checked_in':
        return 'verdict.alreadyCheckedIn'
      case 'not_applicable':
        return 'verdict.validNotApplied'
      default:
        return 'verdict.valid'
    }
  }

  switch (verdict) {
    case 'invalid_signature':
      return 'verdict.invalidSignature'
    case 'outside_time_window':
      return 'verdict.outsideTimeWindow'
    case 'already_used':
      return 'verdict.alreadyUsed'
    case 'not_honourable':
      return 'verdict.notHonourable'
    default:
      return 'errors.genericError'
  }
}

interface Props {
  result: VerifyQrActionResult | null
  pending: boolean
}

export function ScanResultPanel({ result, pending }: Props) {
  const t = useTranslations('scan.result')

  if (pending || !result) {
    return (
      <div className="scanner-result" role="status">
        <div className="scanner-result__head">
          <ScanLine size={22} strokeWidth={2} aria-hidden="true" />
          {pending ? t('pending') : t('idle')}
        </div>
      </div>
    )
  }

  const tone = result.ok
    ? toneForVerdict(result.result.verdict, result.result.checkIn)
    : toneForError(result.errorKey)
  const Icon = TONE_ICON[tone]
  const booking = result.ok ? result.result.booking : null

  return (
    <div className={`scanner-result scanner-result--${tone}`} role="status" aria-live="assertive">
      <div className="scanner-result__head">
        <Icon size={22} strokeWidth={2} aria-hidden="true" />
        {t(messagePathFor(result))}
      </div>
      {booking ? (
        <dl className="scanner-result__body">
          <div>
            <dt>{t('fields.facility')}</dt>
            <dd>{booking.facility.name}</dd>
          </div>
          <div>
            <dt>{t('fields.vehicle')}</dt>
            <dd>
              {booking.vehiclePlate} · {titleCase(booking.vehicleType)}
            </dd>
          </div>
          <div>
            <dt>{t('fields.window')}</dt>
            <dd>
              {formatBookingDate(booking.startsAt)} → {formatBookingDate(booking.endsAt)}
            </dd>
          </div>
          <div>
            <dt>{t('fields.accessCode')}</dt>
            <dd className="mono">{booking.accessCode}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  )
}
