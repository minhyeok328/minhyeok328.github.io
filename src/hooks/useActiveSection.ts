import { useEffect, useState } from 'react'

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

    const sections = (sectionIdsKey ? sectionIdsKey.split('|') : [])
      .map((sectionId) => document.getElementById(sectionId))
      .filter((section): section is HTMLElement => section !== null)
    const latestEntries = new Map<string, IntersectionObserverEntry>()

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => latestEntries.set(entry.target.id, entry))

      const visibleEntry = [...latestEntries.values()]
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0]

      if (visibleEntry) {
        setObservedActiveSection(visibleEntry.target.id)
      }
    }, { rootMargin: '-20% 0px -65%', threshold: [0, 0.25, 0.5, 0.75, 1] })

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [sectionIdsKey])

  return activeSection
}
