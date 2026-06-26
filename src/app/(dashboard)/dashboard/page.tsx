import { Building2, CalendarCheck, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'

export default function DashboardOverviewPage() {
  return (
    <>
      <PageHeader title="Overview" description="A snapshot of your parking operations." />

      <div className="stat-grid">
        <StatCard
          label="Facilities"
          value="—"
          hint="Total parking facilities you currently manage."
          icon={Building2}
          tone="primary"
          index={0}
        />
        <StatCard
          label="Active bookings"
          value="—"
          hint="Bookings currently in progress across all facilities."
          icon={CalendarCheck}
          tone="success"
          index={1}
        />
        <StatCard
          label="Revenue today"
          value="—"
          hint="Confirmed revenue collected since midnight."
          icon={Wallet}
          tone="warning"
          index={2}
        />
      </div>

      <p className="text-secondary phase-note">
        This is the Phase 1 dashboard shell. Live metrics and management views arrive in later phases.
      </p>
    </>
  )
}
