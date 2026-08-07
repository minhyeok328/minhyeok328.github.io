import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useActiveSection } from './useActiveSection'

function intersectionEntry(
  target: HTMLElement,
  isIntersecting: boolean,
  intersectionRatio: number,
): IntersectionObserverEntry {
  return { target, isIntersecting, intersectionRatio } as unknown as IntersectionObserverEntry
}

describe('useActiveSection', () => {
  it('selects a still-visible section when another section leaves in a partial observer callback', () => {
    let callback: IntersectionObserverCallback | undefined

    class TestIntersectionObserver {
      constructor(observerCallback: IntersectionObserverCallback) {
        callback = observerCallback
      }

      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    }

    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)
    document.body.innerHTML = '<section id="about"></section><section id="projects"></section>'
    const about = document.getElementById('about')!
    const projects = document.getElementById('projects')!
    const { result } = renderHook(() => useActiveSection(['about', 'projects']))

    act(() => {
      callback?.([
        intersectionEntry(about, true, 0.8),
        intersectionEntry(projects, true, 0.5),
      ], {} as IntersectionObserver)
    })
    expect(result.current).toBe('about')

    act(() => {
      callback?.([intersectionEntry(about, false, 0)], {} as IntersectionObserver)
    })

    expect(result.current).toBe('projects')
  })
})
