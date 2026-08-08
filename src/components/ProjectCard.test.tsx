import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
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

function renderProjectCard(variant: 'flagship' | 'journey' = 'journey') {
  return render(
    <MemoryRouter>
      <ProjectCard project={project} variant={variant} />
    </MemoryRouter>,
  )
}

describe('ProjectCard', () => {
  it('uses the full compact card as the only internal project action', () => {
    renderProjectCard('journey')

    const card = screen.getByTestId('journey-project')
    const link = within(card).getByRole('link', {
      name: '테스트 프로젝트 상세 페이지 보기',
    })

    expect(link).toHaveAttribute('href', '/projects/test-project/')
    expect(link).toHaveTextContent('테스트 설명')
    expect(link).toHaveTextContent('첫 번째 테스트 기여')
    expect(within(link).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'TypeScript',
      'React',
    ])
    expect(within(card).queryByText('상세 보기')).not.toBeInTheDocument()
    expect(within(card).queryByRole('link', { name: /GitHub/ })).not.toBeInTheDocument()
    expect(link.querySelectorAll('a, button, input, select, textarea')).toHaveLength(0)
    expect(link).not.toHaveTextContent(/[?믠넀]/)
  })

  it('uses explicit card role copy when provided', () => {
    render(
      <MemoryRouter>
        <ProjectCard
          project={{ ...project, cardRoleSummary: '명시된 카드 역할' }}
          variant="flagship"
        />
      </MemoryRouter>,
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
