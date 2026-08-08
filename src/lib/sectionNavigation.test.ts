import { describe, expect, it, vi } from 'vitest'
import { scrollToSection } from './sectionNavigation'

describe('scrollToSection', () => {
  it('scrolls to a section without changing the root URL', () => {
    window.history.replaceState(null, '', '/')
    document.body.innerHTML = '<section id="projects"></section>'
    const target = document.getElementById('projects')!
    Object.defineProperty(target, 'scrollIntoView', { configurable: true, value: vi.fn() })
    const scrollIntoView = vi.spyOn(target, 'scrollIntoView')

    expect(scrollToSection('projects')).toBe(true)
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(window.location.pathname).toBe('/')
    expect(window.location.hash).toBe('')
  })

  it('uses an instant scroll when reduced motion is preferred', () => {
    document.body.innerHTML = '<section id="top"></section>'
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const target = document.getElementById('top')!
    Object.defineProperty(target, 'scrollIntoView', { configurable: true, value: vi.fn() })
    const scrollIntoView = vi.spyOn(target, 'scrollIntoView')

    expect(scrollToSection('top')).toBe(true)
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
  })

  it('returns false when the section does not exist', () => {
    expect(scrollToSection('missing')).toBe(false)
  })
})
