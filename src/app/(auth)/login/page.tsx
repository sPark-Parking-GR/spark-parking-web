import { LoginShell } from '@/components/LoginShell'

interface LoginPageProps {
  searchParams: Promise<{
    from?: string
    error?: 'forbidden' | 'restricted'
    reset?: 'success'
    linked?: 'success'
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { from, error, reset, linked } = await searchParams

  return <LoginShell from={from} error={error} reset={reset} linked={linked} />
}
