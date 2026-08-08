import { useEffect, useState } from 'react'

const SCROLL_SETTLE_DELAY = 150

function isAtDocumentBottom() {
  const { scrollHeight } = document.documentElement

  return (
    scrollHeight > window.innerHeight
    && Math.ceil(window.scrollY + window.innerHeight) >= scrollHeight
  )
}

function getHashOwner(sectionIds: string[]) {
  const hashTarget = document.getElementById(window.location.hash.slice(1))

  if (!hashTarget) {
    return ''
  }

  return sectionIds.reduce((owner, sectionId) => {
    const section = document.getElementById(sectionId)
    return section?.contains(hashTarget) ? sectionId : owner
  }, '')
}

function syncHash(activeSection: string, sectionIds: string[]) {
  const nextHash = `#${activeSection}`

  if (window.location.hash === nextHash || getHashOwner(sectionIds) === activeSection) {
    return
  }

  window.history.replaceState(window.history.state, '', nextHash)
}

export function useActiveSection(sectionIds: string[]): string {
  const sectionIdsKey = sectionIds.join('|')
  const observedSectionIds = sectionIdsKey ? sectionIdsKey.split('|') : []
  const [observedActiveSection, setObservedActiveSection] = useState(observedSectionIds[0] ?? '')
  const activeSection = observedSectionIds.includes(observedActiveSection)
    ? observedActiveSection
    : (observedSectionIds[0] ?? '')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return undefined
    }

    const observedSectionIds = sectionIdsKey ? sectionIdsKey.split('|') : []
    const sections = observedSectionIds
      .map((sectionId) => document.getElementById(sectionId))
      .filter((section): section is HTMLElement => section !== null)
    const latestEntries = new Map<string, IntersectionObserverEntry>()
    const supportsScrollEnd = document.onscrollend !== undefined
    let selectedSectionId = ''
    let scrollSettleTimer: number | undefined
    let scrollSettleStartFrame: number | undefined
    let scrollSettleEndFrame: number | undefined

    const getPendingHashOwner = () => {
      const hashTargetId = window.location.hash.slice(1)
      const hashOwner = getHashOwner(observedSectionIds)

      return (
        hashTargetId
        && hashOwner
        && hashOwner !== selectedSectionId
      ) ? hashOwner : ''
    }

    let pendingHashOwner = getPendingHashOwner()

    const clearScrollSettleTimer = () => {
      if (scrollSettleTimer !== undefined) {
        window.clearTimeout(scrollSettleTimer)
        scrollSettleTimer = undefined
      }
    }

    const clearPostRenderScrollSettle = () => {
      if (scrollSettleStartFrame !== undefined) {
        window.cancelAnimationFrame(scrollSettleStartFrame)
        scrollSettleStartFrame = undefined
      }

      if (scrollSettleEndFrame !== undefined) {
        window.cancelAnimationFrame(scrollSettleEndFrame)
        scrollSettleEndFrame = undefined
      }
    }

    const clearScrollSettleWork = () => {
      clearScrollSettleTimer()
      clearPostRenderScrollSettle()
    }

    const selectSection = (nextSectionId: string) => {
      if (selectedSectionId === nextSectionId) {
        return
      }

      selectedSectionId = nextSectionId
      setObservedActiveSection(nextSectionId)

      if (pendingHashOwner) {
        if (nextSectionId === pendingHashOwner) {
          pendingHashOwner = ''
          clearScrollSettleWork()
        }

        return
      }

      syncHash(nextSectionId, observedSectionIds)
    }

    const handleHashChange = () => {
      clearScrollSettleWork()
      pendingHashOwner = getPendingHashOwner()
    }

    const settlePendingHash = () => {
      if (!pendingHashOwner || !selectedSectionId || selectedSectionId === pendingHashOwner) {
        return
      }

      pendingHashOwner = ''
      clearScrollSettleWork()
      syncHash(selectedSectionId, observedSectionIds)
    }

    const handleScrollEnd = () => {
      if (!supportsScrollEnd || !pendingHashOwner) {
        return
      }

      clearPostRenderScrollSettle()
      scrollSettleStartFrame = window.requestAnimationFrame(() => {
        scrollSettleStartFrame = undefined
        scrollSettleEndFrame = window.requestAnimationFrame(() => {
          scrollSettleEndFrame = undefined
          settlePendingHash()
        })
      })
    }

    const scheduleScrollSettle = () => {
      clearScrollSettleTimer()
      scrollSettleTimer = window.setTimeout(() => {
        scrollSettleTimer = undefined
        settlePendingHash()
      }, SCROLL_SETTLE_DELAY)
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => latestEntries.set(entry.target.id, entry))

      if (isAtDocumentBottom()) {
        const finalSection = sections[sections.length - 1]

        if (finalSection) {
          selectSection(finalSection.id)
        }

        return
      }

      const visibleEntry = [...latestEntries.values()]
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => {
          const ratioDifference = second.intersectionRatio - first.intersectionRatio

          if (ratioDifference !== 0) {
            return ratioDifference
          }

          if (first.target.id === pendingHashOwner) {
            return -1
          }

          return second.target.id === pendingHashOwner ? 1 : 0
        })[0]

      if (visibleEntry) {
        selectSection(visibleEntry.target.id)
      }
    }, { rootMargin: '-20% 0px -65%', threshold: [0, 0.25, 0.5, 0.75, 1] })

    sections.forEach((section) => observer.observe(section))

    const handleScroll = () => {
      clearPostRenderScrollSettle()

      if (isAtDocumentBottom()) {
        const finalSection = sections[sections.length - 1]

        if (finalSection) {
          selectSection(finalSection.id)
        }
      }

      if (!supportsScrollEnd) {
        scheduleScrollSettle()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('scrollend', handleScrollEnd)
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      observer.disconnect()
      clearScrollSettleWork()
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('scrollend', handleScrollEnd)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [sectionIdsKey])

  return activeSection
}
