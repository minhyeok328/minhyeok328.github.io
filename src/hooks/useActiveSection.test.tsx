import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useActiveSection } from './useActiveSection'

function intersectionEntry(
  target: HTMLElement,
  isIntersecting: boolean,
  intersectionRatio: number,
): IntersectionObserverEntry {
  return { target, isIntersecting, intersectionRatio } as unknown as IntersectionObserverEntry
}

function installIntersectionObserver() {
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

  return (entries: IntersectionObserverEntry[]) => {
    act(() => callback?.(entries, {} as IntersectionObserver))
  }
}

describe('useActiveSection', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps Projects selected while its large section remains intersecting', () => {
    document.body.innerHTML = '<section id="about"></section><section id="projects"></section><section id="skills"></section>'
    const emit = installIntersectionObserver()
    const projects = document.getElementById('projects')!
    const skills = document.getElementById('skills')!
    const { result } = renderHook(() => useActiveSection(['about', 'projects', 'skills']))

    emit([intersectionEntry(projects, true, 0.9)])
    emit([
      intersectionEntry(projects, true, 0.4),
      intersectionEntry(skills, true, 0.2),
    ])

    expect(result.current).toBe('projects')
  })

  it('selects sections from observer entries without writing browser history', () => {
    document.body.innerHTML = '<section id="top"></section><section id="projects"></section>'
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const pushState = vi.spyOn(window.history, 'pushState')
    const projects = document.getElementById('projects')!
    const { result } = renderHook(() => useActiveSection(['top', 'projects']))

    emit([intersectionEntry(projects, true, 0.8)])

    expect(result.current).toBe('projects')
    expect(replaceState).not.toHaveBeenCalled()
    expect(pushState).not.toHaveBeenCalled()
  })

  it('selects the final section when scrolling reaches the document bottom', () => {
    document.body.innerHTML = '<section id="top"></section><section id="contact"></section>'
    installIntersectionObserver()
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1000)
    const { result } = renderHook(() => useActiveSection(['top', 'contact']))

    act(() => window.dispatchEvent(new Event('scroll')))

    expect(result.current).toBe('contact')
  })
})
