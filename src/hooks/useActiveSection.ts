import { useEffect, useState } from 'react'

function isAtDocumentBottom() {
  const { scrollHeight } = document.documentElement

  return (
    scrollHeight > window.innerHeight
    && Math.ceil(window.scrollY + window.innerHeight) >= scrollHeight
  )
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

    const selectSection = (sectionId: string) => {
      setObservedActiveSection((currentSectionId) => (
        currentSectionId === sectionId ? currentSectionId : sectionId
      ))
    }

    const selectFinalSectionAtDocumentBottom = () => {
      if (!isAtDocumentBottom()) {
        return false
      }

      const finalSection = sections[sections.length - 1]

      if (finalSection) {
        selectSection(finalSection.id)
      }

      return true
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => latestEntries.set(entry.target.id, entry))

      if (selectFinalSectionAtDocumentBottom()) {
        return
      }

      const visibleEntry = [...latestEntries.values()]
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0]

      if (visibleEntry) {
        selectSection(visibleEntry.target.id)
      }
    }, { rootMargin: '-20% 0px -65%', threshold: [0, 0.25, 0.5, 0.75, 1] })

    sections.forEach((section) => observer.observe(section))

    const handleScroll = () => {
      selectFinalSectionAtDocumentBottom()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [sectionIdsKey])

  return activeSection
}
