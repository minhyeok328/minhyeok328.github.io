import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useBodyScrollLock } from './useBodyScrollLock'

function LockHarness({ restoreScrollY }: { restoreScrollY: number }) {
  useBodyScrollLock(restoreScrollY)
  return null
}

describe('useBodyScrollLock', () => {
  it('compensates the scrollbar and restores the exact body state and scroll position', () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(640)
    const originalClientWidth = Object.getOwnPropertyDescriptor(
      document.documentElement,
      'clientWidth',
    )
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: window.innerWidth - 16,
    })

    Object.assign(document.body.style, {
      position: 'relative',
      top: '4px',
      width: '80%',
      overflow: 'auto',
      paddingRight: '3px',
    })

    const { unmount } = render(<LockHarness restoreScrollY={640} />)

    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.top).toBe('-640px')
    expect(document.body.style.width).toBe('100%')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.paddingRight).toBe('16px')

    unmount()

    expect(document.body.style.position).toBe('relative')
    expect(document.body.style.top).toBe('4px')
    expect(document.body.style.width).toBe('80%')
    expect(document.body.style.overflow).toBe('auto')
    expect(document.body.style.paddingRight).toBe('3px')
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 640, behavior: 'instant' })

    document.body.removeAttribute('style')
    if (originalClientWidth) {
      Object.defineProperty(document.documentElement, 'clientWidth', originalClientWidth)
    } else {
      Reflect.deleteProperty(document.documentElement, 'clientWidth')
    }
  })

  it('locks to the saved position when navigation has already reset window scroll', () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)

    const { unmount } = render(<LockHarness restoreScrollY={640} />)

    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.top).toBe('-640px')

    unmount()
  })
})
