import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from './useTheme'

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', () => ({
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useTheme', () => {
  it('uses a stored theme before the operating-system preference', () => {
    localStorage.setItem('portfolio-theme', 'light')
    mockMatchMedia(true)

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
  })

  it('persists a user toggle and updates the html data attribute', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useTheme())

    act(() => result.current.toggleTheme())

    expect(localStorage.getItem('portfolio-theme')).toBe(result.current.theme)
    expect(document.documentElement.dataset.theme).toBe(result.current.theme)
  })
})
