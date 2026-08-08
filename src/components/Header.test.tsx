import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Header } from './Header'

function mockDesktopMediaQuery() {
  let changeListener: ((event: MediaQueryListEvent) => void) | undefined

  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
      if (query === '(min-width: 768px)') {
        changeListener = listener
      }
    },
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }))

  return () => changeListener?.({ matches: true } as MediaQueryListEvent)
}

describe('Header', () => {
  it('renders the visible MH brand as a native button', () => {
    render(<Header items={[{ id: 'about', label: 'About' }]} activeSection="about" />)

    expect(screen.getByRole('button', { name: 'MH' })).toBeVisible()
  })

  it('renders data-backed navigation controls as native buttons', () => {
    render(<Header items={[{ id: 'about', label: 'About' }, { id: 'projects', label: 'Projects' }]} activeSection="about" />)

    expect(screen.getAllByRole('button', { name: 'About' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Projects' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Journey' })).not.toBeInTheDocument()
  })

  it('opens from the menu button and closes on Escape', async () => {
    const user = userEvent.setup()
    render(<Header items={[{ id: 'about', label: 'About' }]} activeSection="about" />)

    const menuButton = screen.getByRole('button', { name: /메뉴 열기/ })
    await user.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(menuButton).toHaveAccessibleName('메뉴 닫기')

    await user.keyboard('{Escape}')

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(menuButton).toHaveAccessibleName('메뉴 열기')
  })

  it('marks the active data-backed navigation button as the current location', () => {
    render(
      <Header
        items={[
          { id: 'about', label: 'About' },
          { id: 'projects', label: 'Projects' },
        ]}
        activeSection="projects"
      />,
    )

    expect(screen.getAllByRole('button', { name: 'Projects' })).toHaveLength(1)
    for (const button of screen.getAllByRole('button', { name: 'Projects' })) {
      expect(button).toHaveAttribute('aria-current', 'location')
    }
    for (const button of screen.getAllByRole('button', { name: 'About' })) {
      expect(button).not.toHaveAttribute('aria-current')
    }
  })

  it('marks no desktop or mobile navigation button current while the top section is active', () => {
    render(
      <Header
        items={[
          { id: 'about', label: 'About' },
          { id: 'projects', label: 'Projects' },
        ]}
        activeSection="top"
      />,
    )

    const navigationButtons = document.querySelectorAll('.header__navigation-list button')

    expect(navigationButtons).toHaveLength(4)
    navigationButtons.forEach((button) => expect(button).not.toHaveAttribute('aria-current'))
  })

  it('closes the mobile navigation after a mobile button is selected', async () => {
    const user = userEvent.setup()
    render(<Header items={[{ id: 'about', label: 'About' }]} activeSection="about" />)

    const menuButton = screen.getByRole('button', { name: /메뉴 열기/ })
    await user.click(menuButton)
    await user.click(within(screen.getByRole('navigation', { name: /모바일 탐색/ })).getByRole('button'))

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes the mobile navigation when a pointer goes outside the header', async () => {
    const user = userEvent.setup()
    render(<Header items={[{ id: 'about', label: 'About' }]} activeSection="about" />)

    const menuButton = screen.getByRole('button', { name: /메뉴 열기/ })
    await user.click(menuButton)
    await user.pointer({ target: document.body, keys: '[MouseLeft]' })

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes the mobile navigation when the desktop breakpoint becomes active', async () => {
    const emitDesktopChange = mockDesktopMediaQuery()
    const user = userEvent.setup()
    render(<Header items={[{ id: 'about', label: 'About' }]} activeSection="about" />)

    const menuButton = screen.getByRole('button', { name: /메뉴 열기/ })
    await user.click(menuButton)
    act(emitDesktopChange)

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })
})
