import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Project } from '../types/portfolio'
import { ProjectCard } from './ProjectCard'

const project: Project = {
  id: 'test-project',
  order: 1,
  stage: 'Test Stage',
  title: '테스트 프로젝트',
  description: '테스트 설명',
  contribution: ['테스트 기여'],
  growth: '테스트 성장',
  technologies: ['TypeScript'],
  githubUrl: 'https://github.com/example/project',
  image: '/images/missing-project.webp',
}

describe('ProjectCard', () => {
  it('replaces a nonempty project image with an accessible project-initial fallback after a load error', () => {
    render(<ProjectCard project={project} variant="journey" />)

    fireEvent.error(screen.getByAltText('테스트 프로젝트 프로젝트 이미지'))

    const fallback = screen.getByRole('img', {
      name: '테스트 프로젝트 프로젝트 이미지 대체 이미지',
    })

    expect(fallback).toHaveTextContent('테스')
  })
})
