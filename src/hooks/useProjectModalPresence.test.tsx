import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PROJECT_MODAL_EXIT_FALLBACK_MS,
  useProjectModalPresence,
} from './useProjectModalPresence'

interface ModalValue {
  id: string
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn((query: string): MediaQueryList => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  })))
}

describe('useProjectModalPresence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    stubReducedMotion(false)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retains the last value while closing until exit completion', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: ModalValue | null }) => useProjectModalPresence(value),
      { initialProps: { value: { id: 'pickle' } as ModalValue | null } },
    )

    rerender({ value: null })

    expect(result.current.displayedValue).toEqual({ id: 'pickle' })
    expect(result.current.phase).toBe('closing')

    act(() => result.current.completeExit())

    expect(result.current.displayedValue).toBeNull()
  })

  it('completes a closing presentation after the fallback duration', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: ModalValue | null }) => useProjectModalPresence(value),
      { initialProps: { value: { id: 'pickle' } as ModalValue | null } },
    )

    rerender({ value: null })

    act(() => vi.advanceTimersByTime(PROJECT_MODAL_EXIT_FALLBACK_MS - 1))
    expect(result.current.displayedValue).toEqual({ id: 'pickle' })

    act(() => vi.advanceTimersByTime(1))
    expect(result.current.displayedValue).toBeNull()
  })

  it('cancels closing when a renewed value arrives', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: ModalValue | null }) => useProjectModalPresence(value),
      { initialProps: { value: { id: 'pickle' } as ModalValue | null } },
    )

    rerender({ value: null })
    const staleCompleteExit = result.current.completeExit
    rerender({ value: { id: 'lg-home-ai' } })

    expect(result.current.displayedValue).toEqual({ id: 'lg-home-ai' })
    expect(result.current.phase).toBe('open')

    act(() => {
      staleCompleteExit()
      vi.advanceTimersByTime(PROJECT_MODAL_EXIT_FALLBACK_MS)
    })

    expect(result.current.displayedValue).toEqual({ id: 'lg-home-ai' })
    expect(result.current.phase).toBe('open')

    rerender({ value: null })
    expect(result.current.displayedValue).toEqual({ id: 'lg-home-ai' })
    expect(result.current.phase).toBe('closing')
  })

  it('removes the presentation immediately when reduced motion is preferred', () => {
    stubReducedMotion(true)
    const { result, rerender } = renderHook(
      ({ value }: { value: ModalValue | null }) => useProjectModalPresence(value),
      { initialProps: { value: { id: 'pickle' } as ModalValue | null } },
    )

    rerender({ value: null })

    expect(result.current.displayedValue).toBeNull()
    expect(result.current.phase).toBe('open')
    expect(vi.getTimerCount()).toBe(0)
  })
})
