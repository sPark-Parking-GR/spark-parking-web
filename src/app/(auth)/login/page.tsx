import Image from 'next/image'

import { LoginForm } from '@/components/LoginForm'
import { SparkMark } from '@/components/SparkMark'

interface LoginPageProps {
  searchParams: Promise<{ from?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { from, error } = await searchParams

  return (
    <div className="auth-stack">
      <div className="auth-brand">
        <span className="auth-brand__lockup">
          <SparkMark size={34} className="brand-lockup__mark" gradientId="spark-login-grad" />
          <Image
            src="/sPark_title.png"
            alt="sPark"
            width={302}
            height={72}
            priority
            className="auth-brand__title"
          />
        </span>
        <p className="auth-brand__tagline">Make Parking Smart</p>
      </div>

      <section className="auth-card" aria-labelledby="login-title">
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
    </div>
  )
}
