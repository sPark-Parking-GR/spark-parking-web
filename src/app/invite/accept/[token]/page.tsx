import { AcceptInviteShell } from '@/components/AcceptInviteShell'
import { validateInviteAction } from '@/lib/invite-actions'
import { fetchLegalVersions } from '@/lib/legal-api'

interface AcceptInvitePageProps {
  params: Promise<{ token: string }>
}

export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token } = await params
  const [result, versions] = await Promise.all([validateInviteAction(token), fetchLegalVersions()])

  return <AcceptInviteShell token={token} result={result} versions={versions} />
}
