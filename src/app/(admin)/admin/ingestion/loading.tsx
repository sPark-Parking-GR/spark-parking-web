import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="Ingestion" />
      <Skeleton width="100%" height={120} radius={16} />
    </>
  )
}
