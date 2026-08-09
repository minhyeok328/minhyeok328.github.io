import { useLayoutEffect } from 'react'

export function useBodyScrollLock(restoreScrollY: number) {
  useLayoutEffect(() => {
    const bodyStyle = document.body.style
    const lockedScrollY = restoreScrollY
    const scrollbarWidth = Math.max(
      0,
      window.innerWidth - document.documentElement.clientWidth,
    )
    const previousStyles = {
      position: bodyStyle.position,
      top: bodyStyle.top,
      width: bodyStyle.width,
      overflow: bodyStyle.overflow,
      paddingRight: bodyStyle.paddingRight,
    }

    Object.assign(bodyStyle, {
      position: 'fixed',
      top: `-${lockedScrollY}px`,
      width: '100%',
      overflow: 'hidden',
      paddingRight: scrollbarWidth > 0 ? `${scrollbarWidth}px` : previousStyles.paddingRight,
    })

    return () => {
      Object.assign(bodyStyle, previousStyles)
      window.scrollTo({ top: restoreScrollY, behavior: 'instant' })
    }
  }, [restoreScrollY])
}
