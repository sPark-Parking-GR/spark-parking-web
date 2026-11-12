import { AcceptAdminInviteShell } from '@/components/AcceptAdminInviteShell'
import { validateAdminInviteAction } from '@/lib/admin-invite-actions'
import { fetchLegalVersions } from '@/lib/legal-api'

interface AcceptAdminInvitePageProps {
  params: Promise<{ token: string }>
}

export default async function AcceptAdminInvitePage({ params }: AcceptAdminInvitePageProps) {
  const { token } = await params
  const [result, versions] = await Promise.all([
    validateAdminInviteAction(token),
    fetchLegalVersions(),
  ])

  return <AcceptAdminInviteShell token={token} result={result} versions={versions} />
}
