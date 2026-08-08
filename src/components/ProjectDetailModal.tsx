import { useEffect, useLayoutEffect, useRef, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import type { Project } from '../types/portfolio'
import { ProjectDetailView } from './project-detail/ProjectDetailView'

export interface ProjectDetailModalProps {
  project: Project
  previousProject: Project | null
  nextProject: Project | null
  openingCardId: string
  homeScrollY: number
  onClose: () => void
  onPreviousProject?: () => void
  onNextProject?: () => void
}

const tabbableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getTabbableElements(panel: HTMLElement) {
  return Array.from(panel.querySelectorAll<HTMLElement>(tabbableSelector))
    .filter((element) => element.tabIndex >= 0 && element.getAttribute('aria-hidden') !== 'true')
}

export function ProjectDetailModal({
  project,
  previousProject,
  nextProject,
  openingCardId,
  homeScrollY,
  onClose,
  onPreviousProject,
  onNextProject,
}: ProjectDetailModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useBodyScrollLock(homeScrollY)

  useLayoutEffect(() => {
    const appShell = document.getElementById('portfolio-app-shell')
    const shellWasInert = appShell?.hasAttribute('inert') ?? false

    appShell?.setAttribute('inert', '')

    return () => {
      if (!shellWasInert) {
        appShell?.removeAttribute('inert')
      }

      const restoreTarget = document.getElementById(openingCardId)
        ?? document.getElementById('projects-heading')
      restoreTarget?.focus({ preventScroll: true })
    }
  }, [openingCardId])

  useLayoutEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    headingRef.current?.focus({ preventScroll: true })
  }, [project.id])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) {
        return
      }

      const tabbableElements = getTabbableElements(panelRef.current)
      const firstElement = tabbableElements[0]
      const lastElement = tabbableElements.at(-1)
      const activeElement = document.activeElement as HTMLElement | null

      if (!firstElement || !lastElement) {
        event.preventDefault()
        panelRef.current.focus({ preventScroll: true })
        return
      }

      const activeElementIsTabbable = activeElement
        ? tabbableElements.includes(activeElement)
        : false

      if (event.shiftKey && (activeElement === firstElement || !activeElementIsTabbable)) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && (activeElement === lastElement || !activeElementIsTabbable)) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div className="project-detail-modal__backdrop" onClick={handleBackdropClick}>
      <div
        ref={panelRef}
        className="project-detail-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-detail-heading"
        tabIndex={-1}
      >
        <button className="project-detail-modal__close" type="button" onClick={onClose}>
          닫기
        </button>
        <div ref={contentRef} className="project-detail-modal__content">
          <div key={project.id} className="project-detail-modal__detail">
            <ProjectDetailView
              project={project}
              previousProject={previousProject}
              nextProject={nextProject}
              headingRef={headingRef}
              onPreviousProject={onPreviousProject}
              onNextProject={onNextProject}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
