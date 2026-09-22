import { AcceptInviteShell } from '@/components/AcceptInviteShell'
import { validateInviteAction } from '@/lib/invite-actions'

interface AcceptInvitePageProps {
  params: Promise<{ token: string }>
}

export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token } = await params
  const result = await validateInviteAction(token)

  return <AcceptInviteShell token={token} result={result} />
}
