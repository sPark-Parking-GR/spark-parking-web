import { PageHeader } from '@/components/PageHeader'
import { TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="Driver plans" description="Manage rider subscription plans and perks." />
      <TableSkeleton rows={6} columns={8} />
    </>
  )
}
