export function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="stat-card">
      <span className="stat-card__label text-secondary">{label}</span>
      <span className="stat-card__value">{value}</span>
      {hint ? <span className="stat-card__hint text-secondary">{hint}</span> : null}
    </div>
  )
}
