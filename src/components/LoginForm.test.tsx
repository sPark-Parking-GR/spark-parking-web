// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../messages/en.json'

const signInAction = vi.hoisted(() => vi.fn())

vi.mock('@/lib/auth-actions', () => ({ signInAction }))

import { LoginForm } from './LoginForm'

const EMAIL = 'ops@example.gr'

function renderForm(props: Partial<Parameters<typeof LoginForm>[0]> = {}) {
  const onLoginSuccess = vi.fn()
  const onEmailActivity = vi.fn()
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LoginForm onLoginSuccess={onLoginSuccess} onEmailActivity={onEmailActivity} {...props} />
    </NextIntlClientProvider>,
  )
  return { onLoginSuccess, onEmailActivity, user: userEvent.setup() }
}

const emailInput = () => screen.getByLabelText('Work email')
const passwordInput = () => screen.getByLabelText('Password') as HTMLInputElement

async function goToStepTwo(user: ReturnType<typeof userEvent.setup>) {
  await user.type(emailInput(), EMAIL)
  await user.click(screen.getByRole('button', { name: /continue/i }))
  await screen.findByLabelText('Password')
}

describe('LoginForm', () => {
  beforeEach(() => {
    signInAction.mockReset()
    window.localStorage.clear()
  })

  afterEach(cleanup)

  describe('step one', () => {
    it('asks for the email only and does not call the API on Continue', async () => {
      const { user } = renderForm()

      expect(emailInput()).toHaveAttribute('autocomplete', 'username')
      expect(emailInput()).toHaveAttribute('inputmode', 'email')
      expect(emailInput()).toHaveAttribute('autocapitalize', 'none')
      expect(emailInput()).toHaveAttribute('spellcheck', 'false')
      expect(screen.queryByLabelText('Password')).toBeNull()

      await goToStepTwo(user)

      expect(signInAction).not.toHaveBeenCalled()
    })

    it('shows an inline error wired to the field when Continue gets a bad address', async () => {
      const { user } = renderForm()

      await user.type(emailInput(), 'not-an-email')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      const message = await screen.findByText('Enter a valid email address.')
      expect(emailInput()).toHaveAttribute('aria-invalid', 'true')
      expect(emailInput().getAttribute('aria-describedby')).toBe(message.id)
      expect(screen.queryByLabelText('Password')).toBeNull()
    })

    it('validates on blur and clears the error as soon as the person types', async () => {
      const { user } = renderForm()

      await user.type(emailInput(), 'nope')
      await user.tab()
      expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()

      await user.type(emailInput(), '@')
      expect(screen.queryByText('Enter a valid email address.')).toBeNull()
      expect(emailInput()).not.toHaveAttribute('aria-invalid')
      expect(emailInput()).not.toHaveAttribute('aria-describedby')
    })

    it('tells the shell the email field is being used', async () => {
      const { user, onEmailActivity } = renderForm()

      await user.type(emailInput(), 'a')

      expect(onEmailActivity).toHaveBeenCalled()
    })
  })

  describe('step two', () => {
    it('shows the address with its initial and a hidden username field for password managers', async () => {
      const { user } = renderForm()
      await goToStepTwo(user)

      expect(screen.getByText(EMAIL)).toBeInTheDocument()
      expect(screen.getByText('O')).toBeInTheDocument()
      const username = document.querySelector('input[autocomplete="username"]') as HTMLInputElement
      expect(username.value).toBe(EMAIL)
      expect(username).toHaveAttribute('aria-hidden', 'true')
      expect(passwordInput()).toHaveAttribute('autocomplete', 'current-password')
    })

    it('returns to step one on Change, keeping the address and focusing the field', async () => {
      const { user } = renderForm()
      await goToStepTwo(user)

      await user.click(screen.getByRole('button', { name: 'Change' }))

      expect(screen.queryByLabelText('Password')).toBeNull()
      expect(emailInput()).toHaveValue(EMAIL)
      await waitFor(() => expect(emailInput()).toHaveFocus())
    })

    it('toggles password visibility with aria-pressed and a matching label', async () => {
      const { user } = renderForm()
      await goToStepTwo(user)

      const toggle = screen.getByRole('button', { name: 'Show password' })
      expect(toggle).toHaveAttribute('aria-pressed', 'false')
      expect(passwordInput()).toHaveAttribute('type', 'password')

      await user.click(toggle)

      expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(passwordInput()).toHaveAttribute('type', 'text')
    })

    it('warns when Caps Lock is on and clears the warning on blur', async () => {
      const { user } = renderForm()
      await goToStepTwo(user)

      await user.click(passwordInput())
      await user.keyboard('{CapsLock}')
      await user.keyboard('a')
      expect(await screen.findByText('Caps Lock is on')).toBeInTheDocument()

      await user.tab()
      expect(screen.queryByText('Caps Lock is on')).toBeNull()
    })

    it('shows an inline error for an empty password, wired to the field, and clears it on typing', async () => {
      const { user } = renderForm()
      await goToStepTwo(user)

      await user.click(screen.getByRole('button', { name: 'Sign in' }))

      const message = await screen.findByText('Enter your password.')
      expect(passwordInput()).toHaveAttribute('aria-invalid', 'true')
      expect(passwordInput().getAttribute('aria-describedby')).toContain(message.id)
      expect(signInAction).not.toHaveBeenCalled()
      await waitFor(() => expect(passwordInput()).toHaveFocus())

      await user.type(passwordInput(), 'x')

      expect(screen.queryByText('Enter your password.')).toBeNull()
      expect(passwordInput()).not.toHaveAttribute('aria-invalid')
      expect(passwordInput()).not.toHaveAttribute('aria-describedby')
    })

    it('offers "keep me signed in", unticked by default, and sends the choice with the sign-in', async () => {
      signInAction.mockResolvedValue({ ok: true, redirectTo: '/dashboard' })
      const { user } = renderForm()
      await goToStepTwo(user)

      const remember = screen.getByRole('checkbox', { name: 'Keep me signed in for 7 days' })
      expect(remember).not.toBeChecked()

      await user.click(remember)
      await user.type(passwordInput(), 'secret')
      await user.click(screen.getByRole('button', { name: 'Sign in' }))

      await waitFor(() => expect(signInAction).toHaveBeenCalled())
      expect(signInAction.mock.calls[0]?.[2]).toEqual({ remember: true })
    })

    it('sends remember: false when the box is left unticked', async () => {
      signInAction.mockResolvedValue({ ok: true, redirectTo: '/dashboard' })
      const { user } = renderForm()
      await goToStepTwo(user)

      await user.type(passwordInput(), 'secret')
      await user.click(screen.getByRole('button', { name: 'Sign in' }))

      await waitFor(() => expect(signInAction).toHaveBeenCalled())
      expect(signInAction.mock.calls[0]?.[2]).toEqual({ remember: false })
    })

    it('keeps the Sign in button enabled for an empty password (no gating)', async () => {
      const { user } = renderForm()
      await goToStepTwo(user)

      expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
    })
  })

  describe('failed sign-in', () => {
    it('marks only the password, links it to the banner, refocuses and clears it, then un-marks on typing', async () => {
      signInAction.mockResolvedValue({ ok: false, errorKey: 'invalidCredentials' })
      const { user } = renderForm()
      await goToStepTwo(user)

      await user.type(passwordInput(), 'wrong')
      await user.click(screen.getByRole('button', { name: 'Sign in' }))

      const banner = await screen.findByRole('alert')
      expect(banner).toHaveTextContent('Invalid email or password.')
      expect(passwordInput()).toHaveAttribute('aria-invalid', 'true')
      expect(passwordInput().getAttribute('aria-describedby')).toContain(banner.id)
      expect(passwordInput()).toHaveValue('')
      await waitFor(() => expect(passwordInput()).toHaveFocus())
      expect(
        document.querySelector('input[autocomplete="username"]')?.hasAttribute('aria-invalid'),
      ).toBe(false)

      await user.type(passwordInput(), 'r')

      expect(passwordInput()).not.toHaveAttribute('aria-invalid')
      expect(passwordInput()).not.toHaveAttribute('aria-describedby')
    })

    it('shows an amber banner and a countdown on the button for a rate limit', async () => {
      signInAction.mockResolvedValue({ ok: false, errorKey: 'tooManyAttempts', retryAfter: 30 })
      const { user } = renderForm()
      await goToStepTwo(user)

      await user.type(passwordInput(), 'whatever')
      await user.click(screen.getByRole('button', { name: 'Sign in' }))

      expect(await screen.findByText('Too many sign-in attempts.')).toBeInTheDocument()
      const button = await screen.findByRole('button', { name: /Try again in 0:(30|29)/ })
      expect(button).toBeDisabled()
      expect(passwordInput()).not.toHaveAttribute('aria-invalid')
    })

    it('offers a Try again button in the banner for an outage and keeps the password', async () => {
      signInAction.mockResolvedValueOnce({ ok: false, errorKey: 'signInFailed' })
      signInAction.mockResolvedValueOnce({ ok: true, redirectTo: '/dashboard' })
      const { user, onLoginSuccess } = renderForm()
      await goToStepTwo(user)

      await user.type(passwordInput(), 'right-password')
      await user.click(screen.getByRole('button', { name: 'Sign in' }))

      expect(
        await screen.findByText('Unable to sign in right now. Please try again.'),
      ).toBeInTheDocument()
      expect(passwordInput()).toHaveValue('right-password')
      expect(passwordInput()).not.toHaveAttribute('aria-invalid')

      await user.click(screen.getByRole('button', { name: 'Try again' }))

      await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith('/dashboard'))
      expect(signInAction).toHaveBeenCalledTimes(2)
    })
  })

  describe('recent sign-ins', () => {
    const seed = (emails: string[]) =>
      window.localStorage.setItem(
        'spark-recent-logins',
        JSON.stringify(emails.map((email) => ({ email }))),
      )

    it('shows nothing when no one has signed in with "remember me" here', () => {
      renderForm()

      expect(screen.queryByText('Recent sign-ins on this device')).toBeNull()
    })

    it('jumps straight to the password step when a recent address is picked', async () => {
      seed(['a@example.gr', 'b@example.gr', 'c@example.gr'])
      const { user } = renderForm()

      await user.click(await screen.findByRole('button', { name: 'b@example.gr' }))

      expect(await screen.findByLabelText('Password')).toBeInTheDocument()
      expect(screen.queryByLabelText('Work email')).toBeNull()
      expect(signInAction).not.toHaveBeenCalled()
    })

    it('removes a recent address from the list and from storage', async () => {
      seed(['a@example.gr', 'b@example.gr'])
      const { user } = renderForm()

      await user.click(
        await screen.findByRole('button', { name: 'Remove a@example.gr from recent sign-ins' }),
      )

      expect(screen.queryByText('a@example.gr')).toBeNull()
      expect(JSON.parse(window.localStorage.getItem('spark-recent-logins') ?? '[]')).toEqual([
        { email: 'b@example.gr' },
      ])
    })

    it('records the address only after a successful sign-in with "remember me" ticked', async () => {
      signInAction.mockResolvedValue({ ok: true, redirectTo: '/dashboard' })
      const { user, onLoginSuccess } = renderForm()
      await goToStepTwo(user)

      await user.type(passwordInput(), 'right-password')
      await user.click(screen.getByRole('checkbox'))
      await user.click(screen.getByRole('button', { name: 'Sign in' }))

      await waitFor(() => expect(onLoginSuccess).toHaveBeenCalled())
      expect(JSON.parse(window.localStorage.getItem('spark-recent-logins') ?? '[]')).toEqual([
        { email: EMAIL },
      ])
    })

    it('does not record the address when "remember me" is left unticked', async () => {
      signInAction.mockResolvedValue({ ok: true, redirectTo: '/dashboard' })
      const { user, onLoginSuccess } = renderForm()
      await goToStepTwo(user)

      await user.type(passwordInput(), 'right-password')
      await user.click(screen.getByRole('button', { name: 'Sign in' }))

      await waitFor(() => expect(onLoginSuccess).toHaveBeenCalled())
      expect(window.localStorage.getItem('spark-recent-logins')).toBeNull()
    })

    it('ignores corrupt stored data', () => {
      window.localStorage.setItem('spark-recent-logins', '{"not":"a list"}')
      renderForm()

      expect(screen.queryByText('Recent sign-ins on this device')).toBeNull()
    })
  })
})
