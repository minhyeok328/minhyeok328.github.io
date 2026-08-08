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

function mockMissingNativeScrollEnd() {
  vi.spyOn(document, 'onscrollend', 'get').mockReturnValue(undefined as never)
}

function installAnimationFrame() {
  let nextFrameId = 0
  const callbacks = new Map<number, FrameRequestCallback>()

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const frameId = ++nextFrameId
    callbacks.set(frameId, callback)
    return frameId
  })
  vi.stubGlobal('cancelAnimationFrame', (frameId: number) => {
    callbacks.delete(frameId)
  })

  return {
    flushNextFrame: () => {
      const nextCallbacks = [...callbacks.values()]
      callbacks.clear()
      act(() => nextCallbacks.forEach((callback) => callback(performance.now())))
    },
    pendingCount: () => callbacks.size,
  }
}

describe('useActiveSection', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('selects a still-visible section when another section leaves in a partial observer callback', () => {
    const emit = installIntersectionObserver()
    document.body.innerHTML = '<section id="about"></section><section id="projects"></section>'
    const about = document.getElementById('about')!
    const projects = document.getElementById('projects')!
    const { result } = renderHook(() => useActiveSection(['about', 'projects']))

    emit([
      intersectionEntry(about, true, 0.8),
      intersectionEntry(projects, true, 0.5),
    ])
    expect(result.current).toBe('about')

    emit([intersectionEntry(about, false, 0)])

    expect(result.current).toBe('projects')
  })

  it('replaces the hash when scrolling selects another canonical section', () => {
    document.body.innerHTML = '<section id="top"></section><section id="projects"></section>'
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const pushState = vi.spyOn(window.history, 'pushState')
    const projects = document.getElementById('projects')!
    const { result } = renderHook(() => useActiveSection(['top', 'projects']))

    emit([intersectionEntry(projects, true, 0.8)])

    expect(result.current).toBe('projects')
    expect(window.location.hash).toBe('#projects')
    expect(replaceState).toHaveBeenCalledOnce()
    expect(pushState).not.toHaveBeenCalled()
  })

  it('does not write history when no observed section intersects', () => {
    document.body.innerHTML = '<section id="top"></section><section id="about"></section>'
    window.history.replaceState(null, '', '#top')
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const about = document.getElementById('about')!
    renderHook(() => useActiveSection(['top', 'about']))

    emit([intersectionEntry(about, false, 0)])

    expect(window.location.hash).toBe('#top')
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('does not replace an already canonical hash', () => {
    document.body.innerHTML = '<section id="top"></section><section id="projects"></section>'
    window.history.replaceState(null, '', '#projects')
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const projects = document.getElementById('projects')!
    renderHook(() => useActiveSection(['top', 'projects']))

    emit([intersectionEntry(projects, true, 0.8)])

    expect(window.location.hash).toBe('#projects')
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('preserves an initial canonical hash until that section becomes active', () => {
    document.body.innerHTML = '<section id="top"></section><section id="projects"></section>'
    window.history.replaceState(null, '', '/#projects')
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const top = document.getElementById('top')!
    const projects = document.getElementById('projects')!
    const { result } = renderHook(() => useActiveSection(['top', 'projects']))

    emit([intersectionEntry(top, true, 1)])

    expect(result.current).toBe('top')
    expect(window.location.hash).toBe('#projects')
    expect(replaceState).not.toHaveBeenCalled()

    emit([intersectionEntry(projects, true, 1)])

    expect(result.current).toBe('projects')
    expect(window.location.hash).toBe('#projects')
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('preserves a project hash while its deepest canonical owner is active', () => {
    document.body.innerHTML = `
      <section id="projects">
        <article id="humour"></article>
        <section id="journey"><article id="pickle"></article></section>
      </section>
    `
    window.history.replaceState(null, '', '#pickle')
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const journey = document.getElementById('journey')!
    renderHook(() => useActiveSection(['projects', 'journey']))

    emit([intersectionEntry(journey, true, 0.9)])

    expect(window.location.hash).toBe('#pickle')
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('preserves a deep-link hash through intermediate canonical sections', () => {
    document.body.innerHTML = `
      <section id="about"></section>
      <section id="projects">
        <section id="journey"><article id="pickle"></article></section>
      </section>
      <section id="skills"></section>
    `
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const about = document.getElementById('about')!
    const projects = document.getElementById('projects')!
    const journey = document.getElementById('journey')!
    const skills = document.getElementById('skills')!
    const { result } = renderHook(() => (
      useActiveSection(['about', 'projects', 'journey', 'skills'])
    ))

    emit([intersectionEntry(about, true, 0.8)])
    expect(result.current).toBe('about')
    expect(window.location.hash).toBe('#about')

    act(() => {
      window.location.hash = '#pickle'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    emit([intersectionEntry(projects, true, 0.85)])

    expect(result.current).toBe('projects')
    expect(window.location.hash).toBe('#pickle')

    emit([intersectionEntry(journey, true, 0.9)])

    expect(result.current).toBe('journey')
    expect(window.location.hash).toBe('#pickle')

    replaceState.mockClear()
    emit([intersectionEntry(skills, true, 1)])

    expect(result.current).toBe('skills')
    expect(window.location.hash).toBe('#skills')
    expect(replaceState).toHaveBeenCalledOnce()
    expect(replaceState).toHaveBeenCalledWith(window.history.state, '', '#skills')
  })

  it('selects the final canonical section when scrolling reaches the document bottom', () => {
    document.body.innerHTML = `
      <section id="top"></section>
      <section id="skills"></section>
      <section id="contact"></section>
    `
    installIntersectionObserver()
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1000)
    const { result } = renderHook(() => useActiveSection(['top', 'skills', 'contact']))

    act(() => window.dispatchEvent(new Event('scroll')))

    expect(result.current).toBe('contact')
    expect(window.location.hash).toBe('#contact')
  })

  it('keeps the final section selected when an observer callback arrives at document bottom', () => {
    document.body.innerHTML = `
      <section id="top"></section>
      <section id="skills"></section>
      <section id="contact"></section>
    `
    const emit = installIntersectionObserver()
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1000)
    const skills = document.getElementById('skills')!
    const contact = document.getElementById('contact')!
    const { result } = renderHook(() => useActiveSection(['top', 'skills', 'contact']))

    act(() => window.dispatchEvent(new Event('scroll')))
    emit([
      intersectionEntry(skills, true, 1),
      intersectionEntry(contact, true, 0.1),
    ])

    expect(result.current).toBe('contact')
    expect(window.location.hash).toBe('#contact')
  })

  it('settles an interrupted deep-link scroll on the selected section and later selects Contact at document bottom', () => {
    vi.useFakeTimers()
    vi.spyOn(document, 'onscrollend', 'get').mockReturnValue(null)
    const animationFrame = installAnimationFrame()
    document.body.innerHTML = `
      <section id="about"></section>
      <section id="projects">
        <section id="journey"><article id="pickle"></article></section>
      </section>
      <section id="contact"></section>
    `
    window.history.replaceState(null, '', '#pickle')
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    let scrollY = 500
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollY)
    const projects = document.getElementById('projects')!
    const { result } = renderHook(() => (
      useActiveSection(['about', 'projects', 'journey', 'contact'])
    ))

    act(() => window.dispatchEvent(new Event('scroll')))
    emit([intersectionEntry(projects, true, 0.9)])
    expect(result.current).toBe('projects')
    expect(window.location.hash).toBe('#pickle')

    act(() => document.dispatchEvent(new Event('scrollend')))

    expect(window.location.hash).toBe('#pickle')
    expect(replaceState).not.toHaveBeenCalled()

    animationFrame.flushNextFrame()
    expect(window.location.hash).toBe('#pickle')

    animationFrame.flushNextFrame()
    expect(window.location.hash).toBe('#projects')
    expect(replaceState).toHaveBeenCalledOnce()
    expect(animationFrame.pendingCount()).toBe(0)

    scrollY = 1000
    act(() => window.dispatchEvent(new Event('scroll')))

    expect(result.current).toBe('contact')
    expect(window.location.hash).toBe('#contact')
  })

  it('preserves a deep hash when its owner is observed after scrollend but before post-render settlement', () => {
    vi.spyOn(document, 'onscrollend', 'get').mockReturnValue(null)
    const animationFrame = installAnimationFrame()
    document.body.innerHTML = `
      <section id="projects">
        <section id="journey"><article id="pickle"></article></section>
      </section>
    `
    window.history.replaceState(null, '', '#pickle')
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const projects = document.getElementById('projects')!
    const journey = document.getElementById('journey')!
    renderHook(() => useActiveSection(['projects', 'journey']))

    emit([intersectionEntry(projects, true, 0.9)])
    act(() => document.dispatchEvent(new Event('scrollend')))
    expect(animationFrame.pendingCount()).toBe(1)
    emit([intersectionEntry(journey, true, 0.95)])

    expect(window.location.hash).toBe('#pickle')
    expect(replaceState).not.toHaveBeenCalled()
    expect(animationFrame.pendingCount()).toBe(0)
  })

  it('cancels native post-render settlement when scrolling resumes', () => {
    vi.spyOn(document, 'onscrollend', 'get').mockReturnValue(null)
    const animationFrame = installAnimationFrame()
    document.body.innerHTML = `
      <section id="projects">
        <section id="journey"><article id="pickle"></article></section>
      </section>
    `
    window.history.replaceState(null, '', '#pickle')
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const projects = document.getElementById('projects')!
    renderHook(() => useActiveSection(['projects', 'journey']))

    emit([intersectionEntry(projects, true, 0.9)])
    act(() => document.dispatchEvent(new Event('scrollend')))
    animationFrame.flushNextFrame()
    act(() => window.dispatchEvent(new Event('scroll')))
    animationFrame.flushNextFrame()

    expect(window.location.hash).toBe('#pickle')
    expect(replaceState).not.toHaveBeenCalled()
    expect(animationFrame.pendingCount()).toBe(0)
  })

  it('cancels native post-render settlement when a new deep-link intent starts', () => {
    vi.spyOn(document, 'onscrollend', 'get').mockReturnValue(null)
    const animationFrame = installAnimationFrame()
    document.body.innerHTML = `
      <section id="projects">
        <section id="journey"><article id="pickle"></article></section>
      </section>
      <section id="contact"><a id="email"></a></section>
    `
    window.history.replaceState(null, '', '#pickle')
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const projects = document.getElementById('projects')!
    renderHook(() => useActiveSection(['projects', 'journey', 'contact']))

    emit([intersectionEntry(projects, true, 0.9)])
    act(() => document.dispatchEvent(new Event('scrollend')))
    animationFrame.flushNextFrame()
    act(() => {
      window.location.hash = '#email'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    animationFrame.flushNextFrame()

    expect(window.location.hash).toBe('#email')
    expect(replaceState).not.toHaveBeenCalled()
    expect(animationFrame.pendingCount()).toBe(0)
  })

  it('cancels native post-render settlement when the hook unmounts', () => {
    vi.spyOn(document, 'onscrollend', 'get').mockReturnValue(null)
    const animationFrame = installAnimationFrame()
    document.body.innerHTML = `
      <section id="projects">
        <section id="journey"><article id="pickle"></article></section>
      </section>
    `
    window.history.replaceState(null, '', '#pickle')
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const projects = document.getElementById('projects')!
    const { unmount } = renderHook(() => useActiveSection(['projects', 'journey']))

    emit([intersectionEntry(projects, true, 0.9)])
    act(() => document.dispatchEvent(new Event('scrollend')))
    animationFrame.flushNextFrame()
    unmount()
    animationFrame.flushNextFrame()

    expect(window.location.hash).toBe('#pickle')
    expect(replaceState).not.toHaveBeenCalled()
    expect(animationFrame.pendingCount()).toBe(0)
  })

  it('does not schedule the fallback timer when document scrollend is supported', () => {
    vi.useFakeTimers()
    vi.spyOn(document, 'onscrollend', 'get').mockReturnValue(null)
    document.body.innerHTML = `
      <section id="projects">
        <section id="journey"><article id="pickle"></article></section>
      </section>
    `
    window.history.replaceState(null, '', '#pickle')
    installIntersectionObserver()
    renderHook(() => useActiveSection(['projects', 'journey']))

    act(() => window.dispatchEvent(new Event('scroll')))

    expect(vi.getTimerCount()).toBe(0)
  })

  it('settles an interrupted deep-link scroll after scrolling goes idle without scrollend', () => {
    vi.useFakeTimers()
    mockMissingNativeScrollEnd()
    document.body.innerHTML = `
      <section id="projects">
        <section id="journey"><article id="pickle"></article></section>
      </section>
    `
    window.history.replaceState(null, '', '#pickle')
    const emit = installIntersectionObserver()
    const projects = document.getElementById('projects')!
    renderHook(() => useActiveSection(['projects', 'journey']))

    act(() => window.dispatchEvent(new Event('scroll')))
    emit([intersectionEntry(projects, true, 0.9)])
    act(() => vi.runOnlyPendingTimers())

    expect(window.location.hash).toBe('#projects')
  })

  it('cancels a scheduled settle when a new deep-link intent starts', () => {
    vi.useFakeTimers()
    mockMissingNativeScrollEnd()
    document.body.innerHTML = `
      <section id="projects">
        <section id="journey"><article id="pickle"></article></section>
      </section>
      <section id="contact"><a id="email"></a></section>
    `
    window.history.replaceState(null, '', '#pickle')
    const emit = installIntersectionObserver()
    const projects = document.getElementById('projects')!
    renderHook(() => useActiveSection(['projects', 'journey', 'contact']))

    act(() => window.dispatchEvent(new Event('scroll')))
    emit([intersectionEntry(projects, true, 0.9)])
    act(() => {
      window.location.hash = '#email'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
      vi.runOnlyPendingTimers()
    })

    expect(window.location.hash).toBe('#email')
  })

  it('cancels scheduled settle work when the pending deep-link owner is reached', () => {
    vi.useFakeTimers()
    mockMissingNativeScrollEnd()
    document.body.innerHTML = `
      <section id="projects">
        <section id="journey"><article id="pickle"></article></section>
      </section>
    `
    window.history.replaceState(null, '', '#pickle')
    const emit = installIntersectionObserver()
    const journey = document.getElementById('journey')!
    renderHook(() => useActiveSection(['projects', 'journey']))

    act(() => window.dispatchEvent(new Event('scroll')))
    expect(vi.getTimerCount()).toBe(1)

    emit([intersectionEntry(journey, true, 0.9)])

    expect(window.location.hash).toBe('#pickle')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancels pending deep-link settle work when the hook unmounts', () => {
    vi.useFakeTimers()
    mockMissingNativeScrollEnd()
    document.body.innerHTML = `
      <section id="projects">
        <section id="journey"><article id="pickle"></article></section>
      </section>
    `
    window.history.replaceState(null, '', '#pickle')
    const emit = installIntersectionObserver()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const projects = document.getElementById('projects')!
    const { unmount } = renderHook(() => useActiveSection(['projects', 'journey']))

    act(() => window.dispatchEvent(new Event('scroll')))
    emit([intersectionEntry(projects, true, 0.9)])
    unmount()
    act(() => {
      document.dispatchEvent(new Event('scrollend'))
      vi.runOnlyPendingTimers()
    })

    expect(window.location.hash).toBe('#pickle')
    expect(replaceState).not.toHaveBeenCalled()
  })
})
