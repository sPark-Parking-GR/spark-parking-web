import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" description="Platform-wide performance insights." />
      <EmptyState title="Coming soon" message="Analytics arrive in a later phase." />
    </>
  )
}
