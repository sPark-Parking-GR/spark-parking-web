import { PageHeader } from '@/components/PageHeader'
import { FacilityFormSkeleton } from '@/components/FacilityFormSkeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="New facility" />
      <FacilityFormSkeleton />
    </>
  )
}
