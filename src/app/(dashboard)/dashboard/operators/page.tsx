import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'

export default function OperatorsPage() {
  return (
    <>
      <PageHeader title="Operators" description="Manage operator accounts across the platform." />
      <EmptyState title="Coming soon" message="Operator management arrives in a later phase." />
    </>
  )
}
