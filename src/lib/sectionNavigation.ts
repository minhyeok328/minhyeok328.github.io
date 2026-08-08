export function scrollToSection(sectionId: string) {
  const target = document.getElementById(sectionId)

  if (!target) {
    return false
  }

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  return true
}
