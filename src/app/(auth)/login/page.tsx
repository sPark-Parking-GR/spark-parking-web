import { LoginForm } from '@/components/LoginForm'

interface LoginPageProps {
  searchParams: Promise<{ from?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { from, error } = await searchParams

  return (
    <section className="auth-card" aria-labelledby="login-title">
      <header className="auth-card__head">
        <span className="brand">sPark</span>
        <span className="brand__tag">Admin</span>
      </header>

      <h1 id="login-title" className="h-heading auth-card__title">
        Sign in to your dashboard
      </h1>

      {error === 'forbidden' ? (
        <p className="auth-alert" role="alert">
          This account does not have access to the admin dashboard. Sign in with an operator or platform
          administrator account.
        </p>
      ) : null}

      <LoginForm from={from} />
    </section>
  )
}
