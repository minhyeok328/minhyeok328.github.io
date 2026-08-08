import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { portfolioData } from '../data/portfolio'
import { getOrderedProjects } from '../lib/projects'
import type { Project } from '../types/portfolio'
import { ProjectDetailModal } from './ProjectDetailModal'

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
}

function ModalHarness({
  project = pickle,
  show = true,
  openingCardId = 'project-card-trigger-pickle',
  onClose = () => undefined,
  onPreviousProject = () => undefined,
  onNextProject = () => undefined,
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

  it('closes from the close button and Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ModalHarness onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
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
})
