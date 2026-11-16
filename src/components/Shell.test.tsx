// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../messages/en.json'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/bookings',
  useRouter: () => ({ refresh: vi.fn() }),
}))
vi.mock('@/lib/auth-actions', () => ({ signOutAction: vi.fn() }))

import { BottomTabBar } from './BottomTabBar'
import { MenuButton } from './NavDrawerControls'
import { ShellFrame } from './ShellFrame'
import { Sidebar } from './Sidebar'
import { navForOperator, tabItemsFor } from '@/lib/nav'

const account = {
  name: 'Ada Operator',
  email: 'ada@example.gr',
  roleLabel: 'Operator admin',
  initials: 'AO',
}
const items = navForOperator('operator_admin', true)

function setViewport(width: number) {
  window.matchMedia = ((query: string) => {
    const min = /min-width:\s*(\d+)px/.exec(query)
    const max = /max-width:\s*(\d+)px/.exec(query)
    const matches = (min ? width >= Number(min[1]) : true) && (max ? width <= Number(max[1]) : true)
    return {
      matches,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    } as unknown as MediaQueryList
  }) as typeof window.matchMedia
}

function renderShell() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ShellFrame>
        <Sidebar items={items} account={account} isPlatform={false} />
        <div data-shell-main>
          <MenuButton />
          <div className="dashboard-scroll" />
          <BottomTabBar items={tabItemsFor(items)} />
        </div>
      </ShellFrame>
    </NextIntlClientProvider>,
  )
  return userEvent.setup()
}

const shellEl = () => document.querySelector('.dashboard-shell')
const sidebarEl = () => document.getElementById('app-sidebar') as HTMLElement

beforeEach(() => window.localStorage.clear())
afterEach(cleanup)

describe('docked sidebar', () => {
  beforeEach(() => setViewport(1280))

  it('groups items, marks the current page and collapses to a rail that persists', async () => {
    const user = renderShell()
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getByRole('group', { name: 'Operations' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Bookings' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    const toggle = screen.getByRole('button', { name: 'Collapse' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await user.click(toggle)

    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(window.localStorage.getItem('spark-sb')).toBe('rail')
    expect(within(nav).getByRole('link', { name: 'Bookings' })).toHaveAttribute(
      'data-tooltip',
      'Bookings',
    )

    cleanup()
    renderShell()
    expect(await screen.findByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()
  })

  it('expands again and persists that too', async () => {
    window.localStorage.setItem('spark-sb', 'rail')
    const user = renderShell()
    await user.click(await screen.findByRole('button', { name: 'Expand sidebar' }))
    expect(window.localStorage.getItem('spark-sb')).toBe('full')
  })
})

describe('off-canvas drawer', () => {
  beforeEach(() => setViewport(390))

  it('opens from the menu button, focuses the current item, and returns focus on Escape', async () => {
    const user = renderShell()
    expect(sidebarEl()).toHaveAttribute('inert')

    const opener = screen.getByRole('button', { name: 'Open menu' })
    await user.click(opener)
    expect(opener).toHaveAttribute('aria-expanded', 'true')
    expect(opener).toHaveAccessibleName('Close menu')
    expect(sidebarEl()).not.toHaveAttribute('inert')
    // The menu hangs from the header, so the header stays live as the toggle.
    expect(document.querySelector('[data-shell-main]')).not.toHaveAttribute('inert')
    expect(document.querySelector('.dashboard-scroll')).toHaveAttribute('inert')
    expect(within(sidebarEl()).getByRole('link', { name: 'Bookings' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(sidebarEl()).toHaveAttribute('inert')
    expect(document.querySelector('.dashboard-scroll')).not.toHaveAttribute('inert')
    expect(opener).toHaveFocus()
  })

  it('toggles closed from the same header button', async () => {
    const user = renderShell()
    const toggle = screen.getByRole('button', { name: 'Open menu' })
    await user.click(toggle)
    await user.click(toggle)
    expect(shellEl()).not.toHaveAttribute('data-open')
    expect(toggle).toHaveAccessibleName('Open menu')
  })

  it('closes from the close button and returns focus to the Menu tab that opened it', async () => {
    const user = renderShell()
    const tab = screen.getByRole('button', { name: 'Menu' })
    await user.click(tab)
    await user.click(document.querySelector<HTMLElement>('[data-drawer-close]')!)
    expect(tab).toHaveFocus()
    expect(tab).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes when a nav item is chosen', async () => {
    const user = renderShell()
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const link = within(sidebarEl()).getByRole('link', { name: 'Scan' })
    link.addEventListener('click', (event) => event.preventDefault())
    await act(async () => {
      await user.click(link)
    })
    expect(shellEl()).not.toHaveAttribute('data-open')
  })
})

describe('tablet overlay', () => {
  beforeEach(() => setViewport(900))

  it('expands over the content from the rail and closes with Escape', async () => {
    const user = renderShell()
    const expand = screen.getByRole('button', { name: 'Expand sidebar' })
    await user.click(expand)
    expect(shellEl()).toHaveAttribute('data-open', 'true')
    await user.keyboard('{Escape}')
    expect(shellEl()).not.toHaveAttribute('data-open')
    expect(expand).toHaveFocus()
  })
})

describe('phone tab bar', () => {
  beforeEach(() => setViewport(390))

  it('lists only reachable destinations, then Menu', () => {
    renderShell()
    const bar = screen.getByRole('navigation', { name: 'Quick navigation' })
    const labels = [...bar.querySelectorAll('a, button')].map((el) => el.textContent)
    expect(labels).toEqual(['Home', 'Bookings', 'Scan', 'Menu'])
  })
})
