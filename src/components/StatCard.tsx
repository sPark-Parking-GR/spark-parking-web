import { Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type StatTone = 'primary' | 'success' | 'warning' | 'neutral'

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  index = 0,
  trend,
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  tone?: StatTone
  index?: number
  trend?: string
}) {
  return (
    <div className="stat-card" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="stat-card__head">
        {Icon ? (
          <span className={`stat-card__icon stat-card__icon--${tone}`} aria-hidden="true">
            <Icon size={18} strokeWidth={2} />
          </span>
        ) : null}
        <span className="stat-card__label text-secondary">{label}</span>
        {hint ? (
          <span
            className="stat-card__info"
            data-tooltip={hint}
            tabIndex={0}
            role="note"
            aria-label={hint}
          >
            <Info size={14} strokeWidth={2} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <span className="stat-card__value">{value}</span>
      {trend ? <span className="stat-card__trend text-secondary">{trend}</span> : null}
    </div>
  )
}
