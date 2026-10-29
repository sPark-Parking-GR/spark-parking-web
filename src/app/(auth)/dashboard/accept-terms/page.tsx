import { redirect } from 'next/navigation'
import { AcceptTermsCard } from '@/components/AcceptTermsCard'
import { fetchLegalStatus } from '@/lib/legal-api'
import { getActiveSession, isAuthenticated } from '@/lib/session'

export default async function AcceptTermsPage() {
  const session = await getActiveSession()
  if (!isAuthenticated(session)) redirect('/login')

  const status = await fetchLegalStatus()
  if (!status || status.required.length === 0) redirect('/dashboard')

  return <AcceptTermsCard versions={status.current} required={status.required} />
}
