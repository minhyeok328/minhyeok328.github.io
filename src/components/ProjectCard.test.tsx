import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Project } from '../types/portfolio'
import { ProjectCard } from './ProjectCard'

const project: Project = {
  id: 'test-project',
  order: 1,
  stage: 'Test Stage',
  title: '테스트 프로젝트',
  description: '테스트 설명',
  contribution: ['첫 번째 테스트 기여', '두 번째 테스트 기여'],
  growth: '테스트 성장',
  technologies: ['TypeScript', 'React', 'Vitest'],
  githubUrl: 'https://github.com/example/project',
  image: '/images/missing-project.webp',
}

function renderProjectCard(
  variant: 'flagship' | 'journey' = 'journey',
  onOpenProject = vi.fn(),
) {
  return {
    onOpenProject,
    ...render(
      <ProjectCard
        project={project}
        variant={variant}
        onOpenProject={onOpenProject}
      />,
    ),
  }
}

describe('ProjectCard', () => {
  it('uses one full-card dialog trigger with a stable identity and no route link', async () => {
    const user = userEvent.setup()
    const { onOpenProject } = renderProjectCard('journey')

    const card = screen.getByTestId('journey-project')
    const trigger = within(card).getByRole('button', {
      name: '테스트 프로젝트 프로젝트 상세 보기',
    })

    expect(card).toHaveAttribute('id', 'test-project')
    expect(trigger).toHaveAttribute('id', 'project-card-trigger-test-project')
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    expect(within(card).getAllByRole('button')).toHaveLength(1)
    expect(within(card).queryByRole('link')).not.toBeInTheDocument()
    expect(card).toHaveTextContent('테스트 설명')
    expect(card).toHaveTextContent('첫 번째 테스트 기여')
    expect(within(card).getByText('내 역할')).toBeInTheDocument()
    expect(within(card).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'TypeScript',
      'React',
    ])
    expect(within(card).queryByText('상세 보기')).not.toBeInTheDocument()
    expect(within(card).queryByRole('link', { name: /GitHub/ })).not.toBeInTheDocument()
    expect(card).not.toHaveTextContent(/[→←]/)

    await user.click(trigger)
    expect(onOpenProject).toHaveBeenCalledWith('test-project')
  })

  it('uses explicit card role copy when provided', () => {
    render(
      <ProjectCard
        project={{ ...project, cardRoleSummary: '명시된 카드 역할' }}
        variant="flagship"
        onOpenProject={() => undefined}
      />,
    )

    expect(screen.getByText('명시된 카드 역할')).toBeInTheDocument()
    expect(screen.queryByText('첫 번째 테스트 기여')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('replaces a failed image with an accessible project-initial fallback', () => {
    renderProjectCard()

    fireEvent.error(screen.getByAltText('테스트 프로젝트 프로젝트 이미지'))

    const fallback = screen.getByRole('img', {
      name: '테스트 프로젝트 프로젝트 이미지 대체 이미지',
    })
    expect(fallback).toHaveTextContent('테스')
  })
})
