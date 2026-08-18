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
    period: '2026.01.01 – 01.02',
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
      expect(screen.getByRole('region', { name: '성장과 회고' })).toHaveTextContent(project.growth)

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

    const contribution = screen.getByRole('region', { name: '직접 기여' })
    expect(within(contribution).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      project.contribution[1],
      project.contribution[2],
    ])

    expect(screen.queryByRole('region', { name: '프로젝트 개요' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '기술 설계와 판단' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '성장과 회고' })).not.toBeInTheDocument()

    const codeLink = screen.getByRole('link', { name: '공식 팀 GitHub에서 코드 보기' })
    expect(codeLink).toHaveAttribute('href', project.githubUrl)
    expect(codeLink).toHaveAttribute('target', '_blank')
    expect(codeLink).toHaveAttribute('rel', 'noreferrer')
    expect(screen.getByRole('img', { name: '테스트 프로젝트 프로젝트 이미지 대체 이미지' })).toBeInTheDocument()
    expect(screen.getByLabelText('프로젝트 핵심 정보')).toBeInTheDocument()
    expect(screen.getByText('진행 기간', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.getByText('내 역할', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.getByText('저장소', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.queryByText('프로젝트 목록')).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '다른 프로젝트' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이전 · 이전 프로젝트' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다음 · 다음 프로젝트' }))

    expect(onNextProject).toHaveBeenCalledOnce()
  })

  it('shows verified facts, a user-controlled demo, and captioned implementation evidence before the case study', () => {
    const project = {
      ...makeProject(),
      period: '2026.05.22 – 07.15',
      operatingEnvironment: 'AWS 팀 배포 환경에서 프론트엔드·API 연동 및 동작 검증',
      evidence: {
        videoSrc: '/media/projects/humour/demo.webm',
        disclosure: '합성 계정과 샘플 데이터를 사용한 로컬 데모입니다.',
        screenshots: [
          {
            src: '/media/projects/humour/analysis-report.png',
            alt: '지원서 분석 리포트 화면',
            title: '분석 리포트',
            caption: '원문과 AI 분석 근거를 함께 확인합니다.',
          },
          {
            src: '/media/projects/humour/interview-questions.png',
            alt: '면접 질문 화면',
            title: '면접 질문',
            caption: '분석 결과를 후속 질문으로 연결합니다.',
          },
        ],
      },
    } as Project & {
      period: string
      operatingEnvironment: string
      evidence: {
        videoSrc: string
        disclosure: string
        screenshots: Array<{ src: string; alt: string; title: string; caption: string }>
      }
    }

    renderDetail(project)

    const facts = screen.getByRole('region', { name: '프로젝트 핵심 정보' })
    expect(within(facts).getByText('진행 기간', { selector: 'dt' })).toBeInTheDocument()
    expect(within(facts).getByText(project.period)).toBeInTheDocument()
    expect(within(facts).getByText('운영 환경', { selector: 'dt' })).toBeInTheDocument()
    expect(within(facts).getByText(project.operatingEnvironment)).toBeInTheDocument()
    expect(within(facts).getByRole('link', { name: '공식 팀 GitHub' })).toHaveAttribute(
      'href',
      project.githubUrl,
    )

    const demo = screen.getByLabelText(`${project.title} 데모 영상`)
    expect(demo.tagName).toBe('VIDEO')
    expect(demo).toHaveAttribute('controls')
    expect(demo).toHaveAttribute('preload', 'metadata')
    expect(demo).toHaveAttribute('poster', project.image)
    expect(demo).not.toHaveAttribute('autoplay')
    expect(screen.getByText('DEMO VIDEO')).toBeInTheDocument()
    expect(screen.queryByText('LIVE DEMO')).not.toBeInTheDocument()
    expect(screen.getByText(project.evidence.disclosure)).toBeInTheDocument()

    const evidence = screen.getByRole('region', { name: '주요 화면과 구현 근거' })
    expect(within(evidence).getAllByRole('figure')).toHaveLength(2)
    expect(within(evidence).getByRole('img', { name: '지원서 분석 리포트 화면' })).toHaveAttribute(
      'loading',
      'lazy',
    )
    expect(within(evidence).getByText('원문과 AI 분석 근거를 함께 확인합니다.')).toBeInTheDocument()
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

  it('stacks each case-study heading above its content', () => {
    const removeStyles = installPortfolioStylesheet(stylesheet)
    try {
      renderDetail(makeProject({
        detail: {
          overview: ['프로젝트 개요 본문'],
          decisions: [{
            title: '기술 판단',
            situation: '기술 판단 상황',
            choice: '기술 판단 선택',
            reason: '기술 판단 이유',
            implementation: '기술 판단 구현',
          }],
          retrospective: ['성장과 회고 본문'],
        },
      }))

      const sectionNames = [
        '프로젝트 개요',
        '직접 기여',
        '기술 설계와 판단',
        '기술 구성',
        '성장과 회고',
      ]

      sectionNames.forEach((name) => {
        const section = screen.getByRole('region', { name })
        const heading = within(section).getByRole('heading', { level: 2, name })

        expect(getComputedStyle(section).display).toBe('block')
        expect(getComputedStyle(heading).marginBottom).toBe('24px')
      })
    } finally {
      removeStyles()
    }
  })

  it('shows hyphen markers for the direct-contribution list', () => {
    const resetStyle = document.createElement('style')
    resetStyle.textContent = 'ol, ul, menu { list-style-type: none; }'
    document.head.append(resetStyle)
    const removeStyles = installPortfolioStylesheet(stylesheet)
    try {
      renderDetail()

      const contribution = screen.getByRole('region', { name: '직접 기여' })
      const list = within(contribution).getByRole('list')

      expect(getComputedStyle(list).listStyleType).toBe('"-  "')
      expect(getComputedStyle(list).listStylePosition).toBe('outside')
    } finally {
      removeStyles()
      resetStyle.remove()
    }
  })

  it('uses a full-width demo and responsive evidence grid without autoplay', () => {
    const removeStyles = installPortfolioStylesheet(stylesheet)
    try {
      renderDetail(portfolioData.flagshipProject)

      const video = screen.getByLabelText('HumouR 데모 영상')
      const facts = screen.getByRole('region', { name: '프로젝트 핵심 정보' })
      const evidenceGrid = document.querySelector('.project-detail__evidence-grid') as HTMLElement

      expect(getComputedStyle(video).display).toBe('block')
      expect(getComputedStyle(video).width).toBe('100%')
      expect(getComputedStyle(video).aspectRatio).toBe('16 / 10')
      expect(getComputedStyle(evidenceGrid).display).toBe('grid')
      expect(getComputedStyle(evidenceGrid).gridTemplateColumns).toBe(
        'repeat(auto-fit, minmax(230px, 1fr))',
      )
      expect(getComputedStyle(facts).gridTemplateColumns).toBe(
        'repeat(auto-fit, minmax(180px, 1fr))',
      )
    } finally {
      removeStyles()
    }
  })

  it('keeps a long project title on one line in the desktop detail hero', () => {
    const removeStyles = installPortfolioStylesheet(stylesheet)
    try {
      const project = makeProject({ title: '차량 운영·관리 비용 계산 시스템' })
      renderDetail(project)

      const heading = screen.getByRole('heading', { level: 1, name: project.title })

      expect(getComputedStyle(heading).whiteSpace).toBe('nowrap')
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
