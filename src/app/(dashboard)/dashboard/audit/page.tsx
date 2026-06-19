import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'

export default function AuditPage() {
  return (
    <>
      <PageHeader title="Audit log" description="Review platform activity and changes." />
      <EmptyState title="Coming soon" message="The audit log arrives in a later phase." />
    </>
  )
}
