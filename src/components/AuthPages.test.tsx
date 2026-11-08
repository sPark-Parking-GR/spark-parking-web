// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../messages/en.json'

const forgotPasswordAction = vi.hoisted(() => vi.fn())
const resetPasswordAction = vi.hoisted(() => vi.fn())
const registerOperatorAction = vi.hoisted(() => vi.fn())
const push = vi.hoisted(() => vi.fn())

vi.mock('@/lib/password-reset-actions', () => ({ forgotPasswordAction, resetPasswordAction }))
vi.mock('@/lib/operator-registration-actions', () => ({ registerOperatorAction }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

import { ForgotPasswordShell } from './ForgotPasswordShell'
import { RegisterOperatorForm } from './RegisterOperatorForm'
import { ResetPasswordForm } from './ResetPasswordForm'

const VERSIONS = { terms: '2026-01', privacy: '2026-01' }

function wrap(node: ReactNode) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {node}
    </NextIntlClientProvider>,
  )
  return userEvent.setup()
}

describe('auth pages', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    forgotPasswordAction.mockReset()
    resetPasswordAction.mockReset()
    registerOperatorAction.mockReset()
    push.mockReset()
  })

  afterEach(cleanup)

  describe('forgot password', () => {
    it('arrives filled from the sign-in page and focuses Send reset link', async () => {
      window.sessionStorage.setItem('spark-auth-email', 'ops@example.gr')
      wrap(<ForgotPasswordShell />)

      await waitFor(() => expect(screen.getByLabelText('Work email')).toHaveValue('ops@example.gr'))
      expect(screen.getByRole('button', { name: 'Send reset link' })).toHaveFocus()
    })

    it('focuses the email field when nothing was handed over', async () => {
      wrap(<ForgotPasswordShell />)

      await waitFor(() => expect(screen.getByLabelText('Work email')).toHaveFocus())
    })

    it('rejects a bad address inline without calling the API', async () => {
      const user = wrap(<ForgotPasswordShell />)

      await user.type(screen.getByLabelText('Work email'), 'nope')
      await user.click(screen.getByRole('button', { name: 'Send reset link' }))

      expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
      expect(forgotPasswordAction).not.toHaveBeenCalled()
    })

    it('shows a Check your email state that names the address and offers resend after 30s', async () => {
      forgotPasswordAction.mockResolvedValue({ ok: true })
      const user = wrap(<ForgotPasswordShell />)

      await user.type(screen.getByLabelText('Work email'), 'ops@example.gr')
      await user.click(screen.getByRole('button', { name: 'Send reset link' }))

      expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
      expect(screen.getByText(/If ops@example\.gr has a sPark account/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Resend in 0:\d\d/ })).toBeDisabled()
    })

    it('goes back to the form with Use a different email', async () => {
      forgotPasswordAction.mockResolvedValue({ ok: true })
      const user = wrap(<ForgotPasswordShell />)
      await user.type(screen.getByLabelText('Work email'), 'ops@example.gr')
      await user.click(screen.getByRole('button', { name: 'Send reset link' }))

      await user.click(await screen.findByRole('button', { name: 'Use a different email' }))

      expect(await screen.findByLabelText('Work email')).toBeInTheDocument()
    })

    it('tells the person to wait when the API throttles the request', async () => {
      forgotPasswordAction.mockResolvedValue({ ok: false, errorKey: 'tooManyAttempts' })
      const user = wrap(<ForgotPasswordShell />)
      await user.type(screen.getByLabelText('Work email'), 'ops@example.gr')
      await user.click(screen.getByRole('button', { name: 'Send reset link' }))

      expect(
        await screen.findByText('Too many requests. Wait a minute and try again.'),
      ).toBeInTheDocument()
    })
  })

  describe('reset password', () => {
    it('has one password field with a Show/Hide toggle and a length meter', async () => {
      const user = wrap(<ResetPasswordForm token="t" />)
      const field = screen.getByLabelText('New password') as HTMLInputElement

      expect(screen.queryByLabelText(/Confirm/)).toBeNull()
      expect(field).toHaveAttribute('autocomplete', 'new-password')

      await user.type(field, '12345678')
      expect(screen.getByText('OK')).toBeInTheDocument()
      await user.type(field, '1234')
      expect(screen.getByText('Good')).toBeInTheDocument()
      await user.type(field, '1234')
      expect(screen.getByText('Strong')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Show password' }))
      expect(field).toHaveAttribute('type', 'text')
    })

    it('adds a hidden username only when this tab requested the link', async () => {
      window.sessionStorage.setItem('spark-auth-email', 'ops@example.gr')
      const { container } = render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ResetPasswordForm token="t" />
        </NextIntlClientProvider>,
      )

      await waitFor(() =>
        expect(container.querySelector('input[autocomplete="username"]')).toHaveValue(
          'ops@example.gr',
        ),
      )
    })

    it('sends the person to sign in with the address carried over on success', async () => {
      window.sessionStorage.setItem('spark-auth-email', 'ops@example.gr')
      resetPasswordAction.mockResolvedValue({ ok: true })
      const user = wrap(<ResetPasswordForm token="abc" />)
      await waitFor(() => expect(window.sessionStorage.getItem('spark-auth-email')).not.toBeNull())

      await user.type(screen.getByLabelText('New password'), 'a-long-enough-pass')
      await user.click(screen.getByRole('button', { name: 'Update password' }))

      await waitFor(() => expect(push).toHaveBeenCalledWith('/login?reset=success'))
      expect(resetPasswordAction).toHaveBeenCalledWith('abc', { password: 'a-long-enough-pass' })
      expect(window.sessionStorage.getItem('spark-auth-email')).toBe('ops@example.gr')
    })

    it('shows its own state with a Send a new link button for a dead token', async () => {
      resetPasswordAction.mockResolvedValue({ ok: false, errorKey: 'invalidToken' })
      const user = wrap(<ResetPasswordForm token="abc" />)

      await user.type(screen.getByLabelText('New password'), 'a-long-enough-pass')
      await user.click(screen.getByRole('button', { name: 'Update password' }))

      expect(await screen.findByRole('link', { name: 'Send a new link' })).toHaveAttribute(
        'href',
        '/forgot-password',
      )
    })

    it('refuses a short password inline and keeps focus there', async () => {
      const user = wrap(<ResetPasswordForm token="abc" />)

      await user.type(screen.getByLabelText('New password'), 'short')
      await user.click(screen.getByRole('button', { name: 'Update password' }))

      expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument()
      expect(screen.getByLabelText('New password')).toHaveAttribute('aria-invalid', 'true')
      expect(resetPasswordAction).not.toHaveBeenCalled()
    })
  })

  describe('register', () => {
    const renderRegister = () =>
      wrap(<RegisterOperatorForm versions={VERSIONS} onRegisterSuccess={vi.fn()} />)

    it('uses the right autocomplete tokens and puts the consent above the button', () => {
      renderRegister()

      expect(screen.getByLabelText('Your name')).toHaveAttribute('autocomplete', 'name')
      expect(screen.getByLabelText('Work email')).toHaveAttribute('autocomplete', 'username')
      expect(screen.getByLabelText('Business name')).toHaveAttribute('autocomplete', 'organization')
      expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password')
      const consent = screen.getByRole('checkbox')
      const submit = screen.getByRole('button', { name: 'Create account' })
      expect(
        consent.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    it('validates a field on blur with an inline message', async () => {
      const user = renderRegister()

      await user.type(screen.getByLabelText('Work email'), 'nope')
      await user.tab()

      expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
      expect(screen.getByLabelText('Work email')).toHaveAttribute('aria-invalid', 'true')
    })

    it('focuses the first invalid field on submit and does not call the API', async () => {
      const user = renderRegister()

      await user.click(screen.getByRole('button', { name: 'Create account' }))

      await waitFor(() => expect(screen.getByLabelText('Your name')).toHaveFocus())
      expect(
        screen.getByText('Accept the Terms of Use and Privacy Policy to continue.'),
      ).toBeInTheDocument()
      expect(registerOperatorAction).not.toHaveBeenCalled()
    })

    it('offers Sign in and Reset password when the address is already registered', async () => {
      registerOperatorAction.mockResolvedValue({
        ok: false,
        errorKey: 'emailTaken',
        loginHint: true,
      })
      const user = renderRegister()
      await user.type(screen.getByLabelText('Your name'), 'Ada Lovelace')
      await user.type(screen.getByLabelText('Work email'), 'ops@example.gr')
      await user.type(screen.getByLabelText('Business name'), 'Central Park')
      await user.type(screen.getByLabelText('Password'), 'a-long-enough-pass')
      await user.type(screen.getByLabelText('Confirm password'), 'a-long-enough-pass')
      await user.click(screen.getByRole('checkbox'))
      await user.click(screen.getByRole('button', { name: 'Create account' }))

      expect(await screen.findByText('This email already has a sPark account.')).toBeInTheDocument()
      await user.click(screen.getByRole('link', { name: 'Reset password' }))
      expect(window.sessionStorage.getItem('spark-auth-email')).toBe('ops@example.gr')
      expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
    })
  })
})
