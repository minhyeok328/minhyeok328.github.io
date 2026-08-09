import { createRef } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { portfolioData } from '../../data/portfolio'
import { getOrderedProjects } from '../../lib/projects'
import { installPortfolioStylesheet, readPortfolioStylesheet } from '../../test/portfolioStylesheet'
import type { Project } from '../../types/portfolio'
import { ProjectDetailView } from './ProjectDetailView'

const stylesheet = await readPortfolioStylesheet()

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test-project',
    order: 2,
    stage: 'Test Stage',
    title: '테스트 프로젝트',
    description: '테스트 프로젝트 설명',
    contribution: ['테스트 역할 요약', '구현 A', '구현 B'],
    growth: '테스트 성장',
    technologies: ['TypeScript', 'React', 'Vitest'],
    teamTechnologies: ['Django', 'AWS'],
    githubUrl: 'https://github.com/example/test-project',
    image: '',
    ...overrides,
  }
}

function renderDetail(project: Project = makeProject()) {
  const previousProject = makeProject({ id: 'previous', title: '이전 프로젝트' })
  const nextProject = makeProject({ id: 'next', title: '다음 프로젝트' })

  const onPreviousProject = vi.fn()
  const onNextProject = vi.fn()

  return {
    onPreviousProject,
    onNextProject,
    ...render(
      <ProjectDetailView
        project={project}
        previousProject={previousProject}
        nextProject={nextProject}
        headingRef={createRef<HTMLHeadingElement>()}
        onPreviousProject={onPreviousProject}
        onNextProject={onNextProject}
      />
    ),
  }
}

describe('ProjectDetailView', () => {
  it.each(getOrderedProjects(portfolioData))(
    'renders complete case-study sections for $title',
    (project) => {
      const { unmount } = renderDetail(project)

      expect(screen.getByRole('region', { name: '프로젝트 개요' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: '기술 설계와 판단' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: '성장과 회고' })).toBeInTheDocument()

      unmount()
    },
  )

  it('renders current project data once and keeps optional sections absent', async () => {
    const project = makeProject()
    const user = userEvent.setup()
    const { onNextProject } = renderDetail(project)

    expect(screen.getByRole('heading', { level: 1, name: project.title })).toBeInTheDocument()
    expect(screen.getAllByText(project.description)).toHaveLength(1)
    expect(screen.getAllByText(project.contribution[0])).toHaveLength(1)
    expect(screen.getAllByText(project.growth)).toHaveLength(1)

    const contribution = screen.getByRole('region', { name: '직접 기여' })
    expect(within(contribution).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      project.contribution[1],
      project.contribution[2],
    ])

    expect(screen.queryByRole('region', { name: '프로젝트 개요' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '기술 설계와 판단' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '성장과 회고' })).not.toBeInTheDocument()

    const codeLink = screen.getByRole('link', { name: 'GitHub에서 코드 보기' })
    expect(codeLink).toHaveAttribute('href', project.githubUrl)
    expect(codeLink).toHaveAttribute('target', '_blank')
    expect(codeLink).toHaveAttribute('rel', 'noreferrer')
    expect(screen.getByRole('img', { name: '테스트 프로젝트 프로젝트 이미지 대체 이미지' })).toBeInTheDocument()
    expect(screen.getByLabelText('프로젝트 빠른 요약')).toBeInTheDocument()
    expect(screen.getByText('프로젝트', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.getByText('내 역할', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.getByText('성장', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.queryByText('프로젝트 목록')).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '다른 프로젝트' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이전 · 이전 프로젝트' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다음 · 다음 프로젝트' }))

    expect(onNextProject).toHaveBeenCalledOnce()
  })

  it('uses explicit detail copy without removing any contributions', () => {
    const project = makeProject({
      cardRoleSummary: '명시적 역할 요약',
      detail: {
        overview: ['상세 프로젝트 개요'],
        decisions: [{
          title: '상태 관리 결정',
          situation: '여러 화면에서 같은 서버 상태를 사용합니다.',
          choice: '서버 상태를 별도로 관리했습니다.',
          reason: '중복 요청과 불일치를 줄이기 위해서입니다.',
          implementation: '공통 Query Key를 적용했습니다.',
          result: '데이터 흐름이 단순해졌습니다.',
          reflection: '경계 정의를 더 일찍 했어야 합니다.',
        }],
        retrospective: ['명시적 회고'],
      },
    })
    renderDetail(project)

    expect(screen.getByText('명시적 역할 요약')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '프로젝트 개요' })).toHaveTextContent(
      '상세 프로젝트 개요',
    )
    expect(screen.getByRole('region', { name: '기술 설계와 판단' })).toHaveTextContent(
      '상태 관리 결정',
    )
    expect(screen.getByText('상황', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.getByText('선택', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.getByText('이유', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.getByText('구현', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.getByText('결과', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.getByText('회고', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '성장과 회고' })).toHaveTextContent('명시적 회고')

    const contribution = screen.getByRole('region', { name: '직접 기여' })
    expect(within(contribution).getAllByRole('listitem').map((item) => item.textContent)).toEqual(
      project.contribution,
    )
  })

  it('groups each technical decision into context, execution, and outcome regions', () => {
    renderDetail(makeProject({
      detail: {
        decisions: [{
          title: '상태 관리 결정',
          situation: '여러 화면에서 같은 서버 상태를 사용합니다.',
          choice: '서버 상태를 별도로 관리했습니다.',
          reason: '중복 요청과 불일치를 줄이기 위해서입니다.',
          implementation: '공통 Query Key를 적용했습니다.',
          result: '데이터 흐름이 단순해졌습니다.',
          reflection: '경계 정의를 더 일찍 했어야 합니다.',
        }, {
          title: '결과가 없는 결정',
          situation: '추가 상황입니다.',
          choice: '추가 선택입니다.',
          reason: '추가 이유입니다.',
          implementation: '추가 구현입니다.',
        }],
      },
    }))

    const decisionSection = screen.getByRole('region', { name: '기술 설계와 판단' })
    const [completeDecision, decisionWithoutOutcome] = within(decisionSection).getAllByRole('article')
    const contextHeading = within(completeDecision).getByRole('heading', { level: 4, name: '판단 배경' })
    const executionHeading = within(completeDecision).getByRole('heading', { level: 4, name: '선택과 실행' })
    const outcomeHeading = within(completeDecision).getByRole('heading', { level: 4, name: '결과와 배움' })
    const context = contextHeading.parentElement as HTMLElement
    const execution = executionHeading.parentElement as HTMLElement
    const outcome = outcomeHeading.parentElement as HTMLElement

    expect(within(context).getByText('여러 화면에서 같은 서버 상태를 사용합니다.')).toBeInTheDocument()
    expect(within(context).getByText('중복 요청과 불일치를 줄이기 위해서입니다.')).toBeInTheDocument()
    expect(within(execution).getByText('서버 상태를 별도로 관리했습니다.')).toBeInTheDocument()
    expect(within(execution).getByText('공통 Query Key를 적용했습니다.')).toBeInTheDocument()
    expect(within(outcome).getByText('데이터 흐름이 단순해졌습니다.')).toBeInTheDocument()
    expect(within(outcome).getByText('경계 정의를 더 일찍 했어야 합니다.')).toBeInTheDocument()
    expect(within(decisionWithoutOutcome).queryByRole('heading', {
      level: 4,
      name: '결과와 배움',
    })).not.toBeInTheDocument()
  })

  it('lets overview and retrospective prose use the full detail width', () => {
    const removeStyles = installPortfolioStylesheet(stylesheet)
    try {
      renderDetail(makeProject({
        detail: {
          overview: ['전체 폭 프로젝트 개요'],
          retrospective: ['전체 폭 성장과 회고'],
        },
      }))

      const overviewParagraph = within(
        screen.getByRole('region', { name: '프로젝트 개요' }),
      ).getByText('전체 폭 프로젝트 개요')
      const retrospectiveParagraph = within(
        screen.getByRole('region', { name: '성장과 회고' }),
      ).getByText('전체 폭 성장과 회고')

      expect(getComputedStyle(overviewParagraph).maxWidth).toBe('none')
      expect(getComputedStyle(retrospectiveParagraph).maxWidth).toBe('none')
    } finally {
      removeStyles()
    }
  })

  it('omits explicitly empty optional sections and team technologies', () => {
    renderDetail(makeProject({
      teamTechnologies: [],
      detail: { overview: [], decisions: [], retrospective: [] },
    }))

    expect(screen.getByRole('region', { name: '직접 사용 기술' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '팀 시스템 연동' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '프로젝트 개요' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '기술 설계와 판단' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '성장과 회고' })).not.toBeInTheDocument()
  })

  it('shows only next at the first boundary and only previous at the last boundary', () => {
    const previousProject = makeProject({ id: 'previous', title: '이전 프로젝트' })
    const nextProject = makeProject({ id: 'next', title: '다음 프로젝트' })
    const onPreviousProject = vi.fn()
    const onNextProject = vi.fn()
    const first = render(
      <ProjectDetailView
        project={makeProject()}
        previousProject={null}
        nextProject={nextProject}
        headingRef={createRef<HTMLHeadingElement>()}
        onPreviousProject={onPreviousProject}
        onNextProject={onNextProject}
      />,
    )

    expect(screen.queryByRole('button', { name: '이전 · 이전 프로젝트' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음 · 다음 프로젝트' })).toBeInTheDocument()
    first.unmount()

    render(
      <ProjectDetailView
        project={makeProject()}
        previousProject={previousProject}
        nextProject={null}
        headingRef={createRef<HTMLHeadingElement>()}
        onPreviousProject={onPreviousProject}
        onNextProject={onNextProject}
      />,
    )

    expect(screen.getByRole('button', { name: '이전 · 이전 프로젝트' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다음 · 다음 프로젝트' })).not.toBeInTheDocument()
  })
})
