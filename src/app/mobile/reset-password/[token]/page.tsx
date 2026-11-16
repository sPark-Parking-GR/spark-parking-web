import { MobileResetPasswordShell } from '@/components/MobileResetPasswordShell'

interface MobileResetPasswordPageProps {
  params: Promise<{ token: string }>
}

export default async function MobileResetPasswordPage({ params }: MobileResetPasswordPageProps) {
  const { token } = await params

  return <MobileResetPasswordShell token={token} />
}
