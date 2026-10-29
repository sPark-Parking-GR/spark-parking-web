import 'server-only'
import { redirect } from 'next/navigation'
import { fetchLegalStatus } from './legal-api'

export const ACCEPT_TERMS_PATH = '/dashboard/accept-terms'

/** Sends a signed-in account to the re-acceptance page when a document's major version moved on. */
export async function requireLegalAcceptance(): Promise<void> {
  const status = await fetchLegalStatus()
  if (status && status.required.length > 0) redirect(ACCEPT_TERMS_PATH)
}
