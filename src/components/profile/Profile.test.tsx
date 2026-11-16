// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../../messages/en.json'

const updateProfileAction = vi.hoisted(() => vi.fn())
const changePasswordAction = vi.hoisted(() => vi.fn())
const requestOwnPasswordResetAction = vi.hoisted(() => vi.fn())

vi.mock('@/lib/profile-actions', () => ({
  updateProfileAction,
  changePasswordAction,
  requestOwnPasswordResetAction,
}))

import { ProfileView } from './ProfileView'

const EMAIL = 'anna@centralpark.gr'

function renderProfile(initialName = 'Anna Papadaki') {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProfileView email={EMAIL} initialName={initialName} roleLabel="Operator admin" />
    </NextIntlClientProvider>,
  )
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

const nameField = () => screen.getByLabelText('Your name') as HTMLInputElement
const saveButton = () => screen.getByRole('button', { name: /^(Save changes|Saved)$/ })

beforeEach(() => {
  // jsdom has no layout, so no scrolling.
  Element.prototype.scrollIntoView = vi.fn()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  updateProfileAction.mockReset()
  changePasswordAction.mockReset()
  requestOwnPasswordResetAction.mockReset()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('profile details', () => {
  it('starts clean, goes dirty on typing and discards back to the saved name', async () => {
    const user = renderProfile()

    expect(screen.getByText('All changes saved')).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Discard' })).toBeNull()

    await user.type(nameField(), ' Jr')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    expect(saveButton()).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(nameField()).toHaveValue('Anna Papadaki')
    expect(screen.getByText('All changes saved')).toBeInTheDocument()
  })

  it('follows the name live in the identity card, including the initials', async () => {
    const user = renderProfile()
    const card = screen.getByRole('complementary')

    expect(card).toHaveTextContent('AP')
    await user.clear(nameField())
    await user.type(nameField(), 'Maria Kostas')

    expect(card).toHaveTextContent('MK')
    expect(card).toHaveTextContent('Maria Kostas')
  })

  it('keeps the email read-only and explains why', () => {
    renderProfile()
    const email = screen.getByLabelText('Email')

    expect(email).toHaveAttribute('readonly')
    expect(email).toHaveAttribute('aria-readonly', 'true')
    expect(screen.getByLabelText("Your sign-in email can't be changed here")).toBeInTheDocument()
  })

  it('saves the trimmed name, shows Saved and announces the toast', async () => {
    updateProfileAction.mockResolvedValue({ ok: true })
    const user = renderProfile()

    await user.clear(nameField())
    await user.type(nameField(), '  Maria Kostas  ')
    await user.click(saveButton())

    await waitFor(() => expect(updateProfileAction).toHaveBeenCalledTimes(1))
    const formData = updateProfileAction.mock.calls[0]?.[1] as FormData
    expect(formData.get('displayName')).toBe('  Maria Kostas  ')

    expect(await screen.findByRole('button', { name: 'Saved' })).toBeInTheDocument()
    expect(screen.getByText('All changes saved')).toBeInTheDocument()
    expect(screen.getAllByRole('status').some((el) => el.textContent === 'Profile updated')).toBe(
      true,
    )

    act(() => {
      vi.advanceTimersByTime(1700)
    })
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })

  it('keeps what was typed and offers Try again when the save fails', async () => {
    updateProfileAction.mockResolvedValueOnce({ ok: false, errorKey: 'errors.genericError' })
    updateProfileAction.mockResolvedValueOnce({ ok: true })
    const user = renderProfile()

    await user.type(nameField(), 'x')
    await user.click(saveButton())

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save your changes.")
    expect(nameField()).toHaveValue('Anna Papadakix')

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(updateProfileAction).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('button', { name: 'Saved' })).toBeInTheDocument()
  })

  it('refuses a name over the limit with a live counter and a disabled Save', async () => {
    const user = renderProfile('')

    await user.click(nameField())
    await user.paste('x'.repeat(121))

    expect(screen.getByText('Name must be at most 120 characters.')).toBeInTheDocument()
    expect(screen.getByText('121/120')).toBeInTheDocument()
    expect(nameField()).toHaveAttribute('aria-invalid', 'true')
    expect(saveButton()).toBeDisabled()

    await user.type(nameField(), '{Backspace}')
    expect(nameField()).not.toHaveAttribute('aria-invalid')
  })
})

describe('profile without a saved name', () => {
  it('shows the email as a muted name, hides the duplicate line and offers the hint', async () => {
    const user = renderProfile('')
    const card = screen.getByRole('complementary')

    expect(card).toHaveTextContent('AN')
    expect(card.querySelectorAll('small')).toHaveLength(0)
    expect(card.querySelector('.pf-idc__fallback')).toHaveTextContent(EMAIL)
    expect(screen.getByText('Add your name', { selector: 'b' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Add your name/ }))
    expect(nameField()).toHaveFocus()
  })

  it('drops the hint and shows the email line once a name is typed', async () => {
    const user = renderProfile('')
    await user.type(nameField(), 'Anna Papadaki')

    const card = screen.getByRole('complementary')
    expect(card.querySelector('.pf-idc__fallback')).toBeNull()
    expect(card).toHaveTextContent(EMAIL)
  })
})

describe('password flow', () => {
  const currentField = () => screen.getByLabelText('Current password') as HTMLInputElement
  const send = (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole('button', { name: 'Send confirmation email' }))

  it('pairs the credentials for password managers with a hidden username', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProfileView email={EMAIL} initialName="A" roleLabel="Operator admin" />
      </NextIntlClientProvider>,
    )

    expect(container.querySelector('input[autocomplete="username"]')).toHaveValue(EMAIL)
    expect(currentField()).toHaveAttribute('autocomplete', 'current-password')
  })

  it('flags an empty submit on the field only, and clears it when typing', async () => {
    const user = renderProfile()
    await send(user)

    expect(screen.getByText('Enter your current password.')).toBeInTheDocument()
    expect(currentField()).toHaveAttribute('aria-invalid', 'true')
    expect(currentField()).toHaveFocus()
    expect(changePasswordAction).not.toHaveBeenCalled()

    await user.type(currentField(), 'x')
    expect(currentField()).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByText('Enter your current password.')).toBeNull()
  })

  it('clears and refocuses the field on a wrong password', async () => {
    changePasswordAction.mockResolvedValue({ ok: false, errorKey: 'errors.wrongPassword' })
    const user = renderProfile()

    await user.type(currentField(), 'nope')
    await send(user)

    expect(await screen.findByText('That is not your current password.')).toBeInTheDocument()
    expect(currentField()).toHaveValue('')
    await waitFor(() => expect(currentField()).toHaveFocus())
    expect(screen.getByText("Confirm it's you").closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    )
  })

  it('advances to the email step, counts down the resend, and starts over', async () => {
    changePasswordAction.mockResolvedValue({ ok: true })
    requestOwnPasswordResetAction.mockResolvedValue({ ok: true })
    const user = renderProfile()

    await user.type(currentField(), 'correct horse')
    await send(user)

    const heading = await screen.findByRole('heading', { name: 'Check your email' })
    await waitFor(() => expect(heading).toHaveFocus())
    expect(screen.getByText(EMAIL, { selector: 'b' })).toBeInTheDocument()
    expect(screen.getByText('Open the email link').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    )

    const resend = screen.getByRole('button', { name: /Resend in 0:30/ })
    expect(resend).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByRole('button', { name: /Resend in 0:2\d/ })).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(21_000)
    })
    const ready = screen.getByRole('button', { name: 'Resend email' })
    expect(ready).toBeEnabled()

    await user.click(ready)
    await waitFor(() => expect(requestOwnPasswordResetAction).toHaveBeenCalledTimes(1))
    expect(await screen.findByRole('button', { name: /Resend in 0:30/ })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Start over' }))
    const back = screen.getByRole('heading', { name: 'Change password' })
    await waitFor(() => expect(back).toHaveFocus())
    expect(currentField()).toHaveValue('')
  })

  it('shows the API message when the confirmation email cannot be sent', async () => {
    changePasswordAction.mockResolvedValue({
      ok: false,
      errorKey: 'errors.genericError',
      detail: 'Too many requests',
    })
    const user = renderProfile()

    await user.type(currentField(), 'pw')
    await send(user)

    expect(await screen.findByText('Too many requests')).toBeInTheDocument()
    expect(currentField()).toHaveValue('pw')
  })
})

describe('reset link panel', () => {
  const trigger = () => screen.getByRole('button', { name: 'Email me a reset link' })

  it('starts idle with the existing copy', () => {
    renderProfile()

    expect(screen.getByText("Can't remember it?")).toBeInTheDocument()
    expect(trigger()).toBeEnabled()
  })

  it('confirms to the signed-in address and holds the resend behind a cooldown', async () => {
    requestOwnPasswordResetAction.mockResolvedValue({ ok: true })
    const user = renderProfile()
    await user.click(trigger())

    expect(await screen.findByText(`Reset link sent to ${EMAIL}.`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Resend in 0:30/ })).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(31_000)
    })
    expect(screen.getByRole('button', { name: 'Resend' })).toBeEnabled()
  })

  it('turns amber with a retry that can succeed', async () => {
    requestOwnPasswordResetAction.mockResolvedValueOnce({
      ok: false,
      errorKey: 'errors.genericError',
    })
    requestOwnPasswordResetAction.mockResolvedValueOnce({ ok: true })
    const user = renderProfile()
    await user.click(trigger())

    expect(await screen.findByText("Couldn't send the email.")).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText(`Reset link sent to ${EMAIL}.`)).toBeInTheDocument()
  })
})
