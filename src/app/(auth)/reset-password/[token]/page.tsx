import { ResetPasswordShell } from '@/components/ResetPasswordShell'

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params

  return <ResetPasswordShell token={token} />
}
