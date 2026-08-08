import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import postcss, { type Rule } from 'postcss'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { portfolioData } from '../data/portfolio'
import type { ProjectModalPhase } from '../hooks/useProjectModalPresence'
import { getOrderedProjects } from '../lib/projects'
import { installPortfolioStylesheet, readPortfolioStylesheet } from '../test/portfolioStylesheet'
import type { Project } from '../types/portfolio'
import { ProjectDetailModal } from './ProjectDetailModal'

const stylesheet = await readPortfolioStylesheet()

function fireAnimationEnd(element: Element) {
  fireEvent(element, new Event('webkitAnimationEnd', { bubbles: true }))
}

const projects = getOrderedProjects(portfolioData)
const pickle = projects.find((project) => project.id === 'pickle') as Project
const lgHomeAi = projects.find((project) => project.id === 'lg-home-ai') as Project
const bankChurners = projects.find((project) => project.id === 'bank-churners') as Project

function AppShell({ children }: { children?: ReactNode }) {
  return (
    <>
      <div id="portfolio-app-shell">
        <button id="project-card-trigger-pickle" type="button">PICKLE 열기</button>
        <h2 id="projects-heading" tabIndex={-1}>Projects</h2>
      </div>
      {children}
    </>
  )
}

interface ModalHarnessProps {
  project?: Project
  show?: boolean
  openingCardId?: string
  onClose?: () => void
  onPreviousProject?: () => void
  onNextProject?: () => void
  phase?: ProjectModalPhase
  onExitComplete?: () => void
}

function ModalHarness({
  project = pickle,
  show = true,
  openingCardId = 'project-card-trigger-pickle',
  onClose = () => undefined,
  onPreviousProject = () => undefined,
  onNextProject = () => undefined,
  phase = 'open',
  onExitComplete = () => undefined,
}: ModalHarnessProps) {
  return (
    <AppShell>
      {show ? (
        <ProjectDetailModal
          project={project}
          previousProject={project.id === 'pickle' ? bankChurners : pickle}
          nextProject={project.id === 'pickle' ? lgHomeAi : null}
          openingCardId={openingCardId}
          homeScrollY={640}
          onClose={onClose}
          onPreviousProject={onPreviousProject}
          onNextProject={project.id === 'pickle' ? onNextProject : undefined}
          phase={phase}
          onExitComplete={onExitComplete}
        />
      ) : null}
    </AppShell>
  )
}

describe('ProjectDetailModal', () => {
  it('renders the real detail view in an inert-shell sibling dialog and focuses its heading', () => {
    render(<ModalHarness />)

    const dialog = screen.getByRole('dialog', { name: 'PICKLE 맛집 추천 챗봇' })
    const heading = screen.getByRole('heading', { name: 'PICKLE 맛집 추천 챗봇' })

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(document.activeElement).toBe(heading)
    expect(document.getElementById('portfolio-app-shell')).toHaveAttribute('inert')
    expect(dialog.closest('#portfolio-app-shell')).toBeNull()
    expect(dialog.parentElement).toHaveClass('project-detail-modal__backdrop')
    expect(screen.getByRole('link', { name: 'GitHub에서 코드 보기' })).toHaveAttribute(
      'href',
      pickle.githubUrl,
    )
  })

  it('accepts only the first synchronous exit request', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ModalHarness onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('marks a closing backdrop and completes only its own animation', () => {
    const onExitComplete = vi.fn()
    render(<ModalHarness phase="closing" onExitComplete={onExitComplete} />)

    const dialog = screen.getByRole('dialog')
    const backdrop = dialog.parentElement as HTMLElement

    expect(backdrop).toHaveClass('project-detail-modal__backdrop--closing')

    fireAnimationEnd(dialog)
    expect(onExitComplete).not.toHaveBeenCalled()

    fireAnimationEnd(backdrop)
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('ignores dismissal and project navigation interactions while closing', () => {
    const onClose = vi.fn()
    const onPreviousProject = vi.fn()
    const onNextProject = vi.fn()
    render(
      <ModalHarness
        phase="closing"
        onClose={onClose}
        onPreviousProject={onPreviousProject}
        onNextProject={onNextProject}
      />,
    )

    const dialog = screen.getByRole('dialog')
    const backdrop = dialog.parentElement as HTMLElement
    const closeButton = document.querySelector<HTMLButtonElement>('.project-detail-modal__close')

    expect(closeButton).not.toBeNull()
    fireEvent.click(closeButton as HTMLButtonElement)
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.pointerDown(backdrop)
    fireEvent.pointerUp(backdrop)
    fireEvent.click(backdrop)
    document.querySelectorAll<HTMLButtonElement>('.project-detail__project-navigation button')
      .forEach((button) => fireEvent.click(button))

    expect(onClose).not.toHaveBeenCalled()
    expect(onPreviousProject).not.toHaveBeenCalled()
    expect(onNextProject).not.toHaveBeenCalled()
  })

  it('closes only when the backdrop itself is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ModalHarness onClose={onClose} />)

    const dialog = screen.getByRole('dialog', { name: 'PICKLE 맛집 추천 챗봇' })
    const backdrop = dialog.parentElement as HTMLElement

    await user.click(dialog)
    expect(onClose).not.toHaveBeenCalled()

    await user.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when a panel-originated pointer interaction is retargeted to the backdrop', () => {
    const onClose = vi.fn()
    render(<ModalHarness onClose={onClose} />)

    const dialog = screen.getByRole('dialog')
    const backdrop = dialog.parentElement as HTMLElement

    fireEvent.pointerDown(dialog)
    fireEvent.pointerUp(backdrop)
    fireEvent.click(backdrop)

    expect(onClose).not.toHaveBeenCalled()

    fireEvent.pointerDown(backdrop)
    fireEvent.pointerUp(backdrop)
    fireEvent.click(backdrop)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('cancels a pending backdrop pointer activation safely', () => {
    const onClose = vi.fn()
    render(<ModalHarness onClose={onClose} />)

    const dialog = screen.getByRole('dialog')
    const backdrop = dialog.parentElement as HTMLElement

    fireEvent.pointerDown(backdrop)
    fireEvent.pointerCancel(backdrop)
    fireEvent.click(backdrop)

    expect(onClose).not.toHaveBeenCalled()

    fireEvent.pointerDown(backdrop)
    fireEvent.pointerUp(backdrop)
    fireEvent.click(backdrop)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('keeps keyboard focus inside the dialog in both Tab directions', async () => {
    const user = userEvent.setup()
    render(<ModalHarness />)

    const closeButton = screen.getByRole('button', { name: '닫기' })
    const nextButton = screen.getByRole('button', { name: '다음 · LG Home AI 가전 상담' })

    await user.tab()
    expect(document.activeElement).toBe(closeButton)

    await user.tab({ shift: true })
    expect(document.activeElement).toBe(nextButton)

    await user.tab()
    expect(document.activeElement).toBe(closeButton)
  })

  it('keeps the dialog mounted while replacing only keyed detail content', () => {
    const { rerender } = render(<ModalHarness />)
    const originalDialog = screen.getByRole('dialog', { name: 'PICKLE 맛집 추천 챗봇' })
    const originalDetail = originalDialog.querySelector('.project-detail-modal__detail')
    const elementScrollTo = vi.mocked(HTMLElement.prototype.scrollTo)
    elementScrollTo.mockClear()

    rerender(<ModalHarness project={lgHomeAi} />)

    const currentDialog = screen.getByRole('dialog', { name: 'LG Home AI 가전 상담' })
    const currentDetail = currentDialog.querySelector('.project-detail-modal__detail')

    expect(currentDialog).toBe(originalDialog)
    expect(currentDetail).not.toBe(originalDetail)
    expect(originalDetail).not.toBeInTheDocument()
    expect(elementScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'LG Home AI 가전 상담' }),
    )
  })

  it('unlocks, restores scroll, and returns focus to the exact opening trigger on close', () => {
    const { rerender } = render(<ModalHarness />)
    const openingTrigger = document.getElementById('project-card-trigger-pickle')
    vi.mocked(window.scrollTo).mockClear()

    rerender(<ModalHarness show={false} />)

    expect(document.getElementById('portfolio-app-shell')).not.toHaveAttribute('inert')
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 640, behavior: 'auto' })
    expect(document.activeElement).toBe(openingTrigger)
  })

  it('falls back to the Projects heading when the opening trigger is unavailable', () => {
    const { rerender } = render(<ModalHarness openingCardId="missing-trigger" />)

    rerender(<ModalHarness show={false} openingCardId="missing-trigger" />)

    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Projects' }))
  })

  it('applies matching 160ms backdrop and panel animations for open and closing phases', () => {
    const removeStyles = installPortfolioStylesheet(stylesheet)
    try {
      const { rerender } = render(<ModalHarness />)
      const dialog = screen.getByRole('dialog')
      const backdrop = dialog.parentElement as HTMLElement

      expect(getComputedStyle(backdrop).backdropFilter).toBe('blur(4px)')
      expect(getComputedStyle(backdrop).animation).toBe(
        'project-detail-modal-backdrop-open 160ms ease both',
      )
      expect(getComputedStyle(dialog).animation).toBe(
        'project-detail-modal-panel-open 160ms ease both',
      )

      rerender(<ModalHarness phase="closing" />)

      expect(getComputedStyle(backdrop).animation).toBe(
        'project-detail-modal-backdrop-close 160ms ease both',
      )
      expect(getComputedStyle(dialog).animation).toBe(
        'project-detail-modal-panel-close 160ms ease both',
      )
    } finally {
      removeStyles()
    }
  })

  it('gives forced-colors backdrop overrides priority over active animations', () => {
    const removeStyles = installPortfolioStylesheet(stylesheet)
    try {
      const forcedColorsMediaRule = Array.from(document.styleSheets)
        .flatMap((sheet) => Array.from(sheet.cssRules))
        .find((rule): rule is CSSMediaRule => (
          rule instanceof CSSMediaRule
          && rule.conditionText === '(forced-colors: active)'
        ))
      const backdropRule = Array.from(forcedColorsMediaRule?.cssRules ?? [])
        .find((rule): rule is CSSStyleRule => (
          rule instanceof CSSStyleRule
          && rule.selectorText === '.project-detail-modal__backdrop'
        ))

      expect(backdropRule?.style.getPropertyValue('background')).toBe('canvas')
      expect(backdropRule?.style.getPropertyPriority('background')).toBe('important')
      expect(backdropRule?.style.getPropertyValue('backdrop-filter')).toBe('none')
      expect(backdropRule?.style.getPropertyPriority('backdrop-filter')).toBe('important')

      const parsedStylesheet = postcss.parse(stylesheet)
      let parsedBackdropRule: Rule | undefined
      parsedStylesheet.walkAtRules('media', (mediaRule) => {
        if (mediaRule.params !== '(forced-colors: active)') return

        mediaRule.walkRules('.project-detail-modal__backdrop', (rule) => {
          parsedBackdropRule = rule
        })
      })
      const parsedDeclarations = new Map<string, { value: string; important: boolean }>()
      parsedBackdropRule?.walkDecls((declaration) => {
        parsedDeclarations.set(declaration.prop, {
          value: declaration.value,
          important: declaration.important,
        })
      })

      expect(parsedDeclarations.get('-webkit-backdrop-filter')).toEqual({
        value: 'none',
        important: true,
      })
    } finally {
      removeStyles()
    }
  })
})
