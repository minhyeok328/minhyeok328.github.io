import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type AnimationEvent as ReactAnimationEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import type { ProjectModalPhase } from '../hooks/useProjectModalPresence'
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
  phase: ProjectModalPhase
  onExitComplete: () => void
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
  phase,
  onExitComplete,
}: ProjectDetailModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const backdropPointerIdRef = useRef<number | null>(null)
  const backdropPointerEndedRef = useRef(false)
  const exitRequestedRef = useRef(false)

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
    if (phase === 'open') {
      exitRequestedRef.current = false
    }
  }, [phase, project.id])

  const requestExit = useCallback(() => {
    if (phase !== 'open' || exitRequestedRef.current) {
      return
    }

    exitRequestedRef.current = true
    onClose()
  }, [onClose, phase])

  const requestPreviousProject = useCallback(() => {
    if (phase !== 'open' || exitRequestedRef.current) {
      return
    }

    onPreviousProject?.()
  }, [onPreviousProject, phase])

  const requestNextProject = useCallback(() => {
    if (phase !== 'open' || exitRequestedRef.current) {
      return
    }

    onNextProject?.()
  }, [onNextProject, phase])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestExit()
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
  }, [requestExit])

  const resetBackdropPointer = () => {
    backdropPointerIdRef.current = null
    backdropPointerEndedRef.current = false
  }

  const handleBackdropPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    backdropPointerIdRef.current = event.target === event.currentTarget
      ? event.pointerId
      : null
    backdropPointerEndedRef.current = false
  }

  const handleBackdropPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    backdropPointerEndedRef.current = event.target === event.currentTarget
      && event.pointerId === backdropPointerIdRef.current
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    const shouldClose = event.target === event.currentTarget
      && backdropPointerIdRef.current !== null
      && backdropPointerEndedRef.current

    resetBackdropPointer()

    if (shouldClose) {
      requestExit()
    }
  }

  const handleBackdropAnimationEnd = (event: ReactAnimationEvent<HTMLDivElement>) => {
    if (phase === 'closing' && event.target === event.currentTarget) {
      onExitComplete()
    }
  }

  return createPortal(
    <div
      className={`project-detail-modal__backdrop${phase === 'closing' ? ' project-detail-modal__backdrop--closing' : ''}`}
      onPointerDown={handleBackdropPointerDown}
      onPointerUp={handleBackdropPointerUp}
      onPointerCancel={resetBackdropPointer}
      onClick={handleBackdropClick}
      onAnimationEnd={handleBackdropAnimationEnd}
    >
      <div
        ref={panelRef}
        className="project-detail-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-detail-heading"
        tabIndex={-1}
      >
        <button
          className="project-detail-modal__close"
          type="button"
          aria-label="닫기"
          onClick={requestExit}
        >
          <span aria-hidden="true">×</span>
        </button>
        <div ref={contentRef} className="project-detail-modal__content">
          <div key={project.id} className="project-detail-modal__detail">
            <ProjectDetailView
              project={project}
              previousProject={previousProject}
              nextProject={nextProject}
              headingRef={headingRef}
              onPreviousProject={onPreviousProject ? requestPreviousProject : undefined}
              onNextProject={onNextProject ? requestNextProject : undefined}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
