import { SparkMark } from '@/components/SparkMark'

interface SparkLogoProps {
  label?: string
  markSize?: number
  onInk?: boolean
  gradientId?: string
}

export function SparkLogo({
  label = 'Admin',
  markSize = 26,
  onInk = false,
  gradientId,
}: SparkLogoProps) {
  return (
    <span className="brand-lockup">
      <SparkMark size={markSize} className="brand-lockup__mark" gradientId={gradientId} />
      <span className="brand-lockup__text">
        <span className={onInk ? 'brand brand--on-ink' : 'brand'}>sPark</span>
        <span className={onInk ? 'brand__tag brand__tag--on-ink' : 'brand__tag'}>{label}</span>
      </span>
    </span>
  )
}
