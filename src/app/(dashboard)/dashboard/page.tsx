import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'

export default function DashboardOverviewPage() {
  return (
    <>
      <PageHeader title="Overview" description="A snapshot of your parking operations." />

      <div className="stat-grid">
        <StatCard label="Facilities" value="—" hint="Phase 1 shell" />
        <StatCard label="Active bookings" value="—" hint="Phase 1 shell" />
        <StatCard label="Revenue today" value="—" hint="Phase 1 shell" />
      </div>

      <p className="text-secondary phase-note">
        This is the Phase 1 dashboard shell. Live metrics and management views arrive in later phases.
      </p>
    </>
  )
}
