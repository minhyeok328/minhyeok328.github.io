import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { installPortfolioStylesheet, readPortfolioStylesheet } from './test/portfolioStylesheet'

const stylesheet = await readPortfolioStylesheet()

describe('App', () => {
  it('presents a position-neutral full-stack identity and separates learning from collaboration', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '서민혁입니다.' })).toBeInTheDocument()
    expect(screen.getByText('서비스의 전체 흐름을 구조화하고 연결하는 풀스택 개발자')).toBeInTheDocument()
    expect(screen.queryByText('AI 기능을 사용자 경험으로 연결하는 프론트엔드 개발자')).not.toBeInTheDocument()

    const about = screen.getByRole('region', { name: 'About' })
    expect(about).toHaveTextContent('데이터와 로직, API와 화면이 맞물려 동작하는 하나의 흐름')
    expect(within(about).getByRole('heading', { level: 3, name: 'How I Learn' })).toBeVisible()
    expect(about).toHaveTextContent('주변 사람들에게 묻고 강사님께 질문하며 이해의 방향을 확인했습니다')

    const workStyle = screen.getByRole('region', { name: 'How I Work' })
    const principles = within(workStyle).getByRole('list', { name: '협업 원칙' })
    expect(within(principles).getAllByRole('listitem')).toHaveLength(3)
    expect(within(workStyle).getByRole('heading', { level: 3, name: '전체를 이해한 뒤 역할을 나눕니다' })).toBeVisible()
    expect(within(workStyle).getByRole('heading', { level: 3, name: '연결 지점과 책임을 먼저 합의합니다' })).toBeVisible()
    expect(within(workStyle).getByRole('heading', { level: 3, name: '진행 과정과 변경 사항을 보이게 관리합니다' })).toBeVisible()
  })

  it('stacks About and How I Work headings above full-width content', () => {
    const removeStyles = installPortfolioStylesheet(stylesheet)
    try {
      render(<App />)

      const about = screen.getByRole('region', { name: 'About' })
      const workStyle = screen.getByRole('region', { name: 'How I Work' })
      const aboutContent = about.querySelector(':scope > .about-section__content') as HTMLElement
      const workPrinciples = workStyle.querySelector(
        ':scope > .work-style-section__principles',
      ) as HTMLElement

      expect(getComputedStyle(about).display).toBe('block')
      expect(getComputedStyle(workStyle).display).toBe('block')
      expect(getComputedStyle(aboutContent).maxWidth).toBe('none')
      expect(getComputedStyle(workPrinciples).maxWidth).toBe('none')
    } finally {
      removeStyles()
    }
  })

  it('renders How I Work as an unboxed list with aligned descriptions', () => {
    const removeStyles = installPortfolioStylesheet(stylesheet)
    try {
      render(<App />)

      const workStyle = screen.getByRole('region', { name: 'How I Work' })
      const principles = within(workStyle).getByRole('list', { name: '협업 원칙' })
      const [firstPrinciple] = within(principles).getAllByRole('listitem')
      const marker = within(firstPrinciple).getByText('-', { selector: 'span' })

      expect(principles).toHaveAttribute('role', 'list')
      expect(getComputedStyle(principles).borderTopWidth).toBe('0px')
      expect(getComputedStyle(principles).borderRadius).toBe('0px')
      expect(getComputedStyle(firstPrinciple).display).toBe('grid')
      expect(getComputedStyle(firstPrinciple).gridTemplateColumns).toBe(
        'auto minmax(0, 1fr)',
      )
      expect(marker).toHaveAttribute('aria-hidden', 'true')
    } finally {
      removeStyles()
    }
  })

  it('keeps all destinations out of the Hero and renders GitHub in Contact', () => {
    render(<App />)

    const hero = screen.getByRole('region', { name: '서민혁입니다.' })
    const contact = screen.getByRole('region', { name: 'Contact' })

    expect(within(hero).queryByRole('link')).not.toBeInTheDocument()
    expect(within(hero).queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'GitHub 보기' })).toHaveLength(1)
    expect(within(contact).getByRole('link', { name: 'GitHub 보기' })).toBeVisible()
  })

  it('keeps Contact details out of the Hero and renders them in Contact', () => {
    render(<App />)

    const contact = screen.getByRole('region', { name: 'Contact' })
    const contactLinks = within(contact).getAllByRole('link')

    expect(within(contact).getByRole('link', { name: 'GitHub 보기' })).toHaveAttribute('href', 'https://github.com/minhyeok328')
    expect(contactLinks).toHaveLength(3)
    expect(contactLinks[0]).toHaveAccessibleName('GitHub 보기')
    expect(contactLinks[1]).toHaveAccessibleName('블로그 보기')
    expect(contactLinks[2]).toHaveAccessibleName('Email 보내기')
    expect(screen.getByRole('link', { name: '블로그 보기' })).toHaveAttribute(
      'href',
      'https://minhyeok328.tistory.com/',
    )
    expect(screen.getByRole('link', { name: 'Email 보내기' })).toHaveAttribute(
      'href',
      'mailto:tjalsgur328@gmail.com',
    )
    expect(screen.queryByRole('link', { name: '이력서 다운로드' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'LinkedIn 보기' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Experience' })).not.toBeInTheDocument()
  })

  it('uses an immediate accessible MH fallback when no profile image is available', () => {
    render(<App />)

    const fallbackImage = screen.getByRole('img', { name: '서민혁 프로필 사진 대체 이미지' })

    expect(fallbackImage).toHaveTextContent('MH')
    expect(screen.queryByAltText('서민혁 프로필 사진')).not.toBeInTheDocument()
  })

  it('presents HumouR as the only flagship and all four earlier stages as a journey', () => {
    render(<App />)

    expect(screen.getByTestId('flagship-project')).toHaveTextContent('HumouR')
    expect(screen.getAllByTestId('journey-project')).toHaveLength(4)
    expect(screen.getByText('Data Integration')).toBeInTheDocument()
    expect(screen.getByText('ML Experimentation')).toBeInTheDocument()
    expect(screen.getAllByText('LLM & RAG').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Web Integration')).toBeInTheDocument()
    expect(screen.getByText('Service Integration')).toBeInTheDocument()
    expect(screen.queryByText('Frontend Flagship')).not.toBeInTheDocument()
  })

  it('gives every project card one stable dialog trigger without a visible CTA', () => {
    render(<App />)

    const projectCards = [
      screen.getByTestId('flagship-project'),
      ...screen.getAllByTestId('journey-project'),
    ]

    expect(projectCards.map((card) => (
      within(card).getByRole('button').getAttribute('id')
    ))).toEqual([
      'project-card-trigger-humour',
      'project-card-trigger-vehicle-tco',
      'project-card-trigger-bank-churners',
      'project-card-trigger-pickle',
      'project-card-trigger-lg-home-ai',
    ])
    expect(projectCards.map((card) => (
      within(card).getByRole('button').getAttribute('aria-label')
    ))).toEqual([
      'HumouR 프로젝트 상세 보기',
      '차량 운영·관리 비용 계산 시스템 프로젝트 상세 보기',
      '신용카드 고객 이탈 분석 프로젝트 상세 보기',
      'PICKLE 맛집 추천 챗봇 프로젝트 상세 보기',
      'LG Home AI 가전 상담 프로젝트 상세 보기',
    ])

    projectCards.forEach((card) => {
      expect(within(card).getAllByRole('button')).toHaveLength(1)
      expect(within(card).queryByRole('link')).not.toBeInTheDocument()
      expect(within(card).getByRole('button')).toHaveAttribute('aria-haspopup', 'dialog')
      expect(within(card).queryByText('상세 보기')).not.toBeInTheDocument()
      expect(card).not.toHaveTextContent(/[→←]/)
    })
  })

  it('uses reviewed project posters without empty image sources', () => {
    const { container } = render(<App />)

    expect(screen.getAllByRole('img', { name: /프로젝트 이미지$/ }).map((image) => (
      image.getAttribute('src')
    ))).toEqual([
      '/media/projects/humour/poster.png',
      '/media/projects/vehicle-tco/poster.png',
      '/media/projects/bank-churners/poster.png',
      '/media/projects/pickle/poster.png',
      '/media/projects/lg-home-ai/poster.png',
    ])
    expect(container.querySelectorAll('img[src=""]')).toHaveLength(0)
  })

  it('keeps Journey cards to one role summary and two technology tags', () => {
    render(<App />)

    screen.getAllByTestId('journey-project').forEach((card) => {
      const cardScope = within(card)

      expect(cardScope.getByText('내 역할')).toBeInTheDocument()
      expect(cardScope.getByRole('list', { name: /주요 기술/ })).toBeInTheDocument()
      expect(cardScope.getAllByRole('listitem')).toHaveLength(2)
      expect(cardScope.queryByRole('heading', { name: '직접 기여' })).not.toBeInTheDocument()
      expect(cardScope.queryByText('성장')).not.toBeInTheDocument()
      expect(cardScope.queryByText('팀 시스템 연동')).not.toBeInTheDocument()
    })
  })

  it('presents the five growth stages in order', () => {
    render(<App />)

    const growthLine = screen.getByRole('navigation', { name: '프로젝트 성장 단계' })

    expect(within(growthLine).getAllByRole('button').map((button) => button.textContent)).toEqual([
      '1단계 · Data Integration',
      '2단계 · ML Experimentation',
      '3단계 · LLM & RAG',
      '4단계 · Web Integration',
      '5단계 · Service Integration',
    ])
  })

  it('keeps Project Journey visible inside Projects without its own section id', () => {
    render(<App />)

    const journeyHeading = screen.getByRole('heading', { level: 3, name: 'Project Journey' })

    expect(journeyHeading).toBeVisible()
    expect(journeyHeading.closest('.projects-section__journey')).not.toHaveAttribute('id')
  })

  it('renders the supplied primary and experience skills in each skill group', () => {
    render(<App />)

    const skillGroups = [
      {
        title: 'Frontend',
        primary: ['React', 'TypeScript', 'Axios', 'TanStack Query', 'Zod'],
        experience: ['JavaScript', 'Tailwind CSS', 'Ant Design', 'Django Templates', 'Streamlit'],
      },
      {
        title: 'LLM Application',
        primary: ['LangGraph', 'LangChain', 'RAG', 'OpenAI API', 'Structured Output'],
        experience: ['Pinecone integration'],
      },
      {
        title: 'Backend & Data',
        primary: ['Python', 'Django', 'pandas', 'scikit-learn', 'XGBoost'],
        experience: ['FastAPI consumption', 'MySQL/SQLite integration', 'Celery/MLflow boundary'],
      },
      {
        title: 'Quality & Delivery',
        primary: ['Vitest', 'Testing Library', 'MSW', 'Playwright', 'Git/GitHub'],
        experience: ['Docker', 'GitHub Actions', 'AWS deployment integration & verification'],
      },
    ]

    skillGroups.forEach(({ title, primary, experience }) => {
      const group = screen.getByRole('heading', { level: 3, name: title }).closest('article')

      expect(group).not.toBeNull()

      const primarySkills = within(group as HTMLElement).getByRole('region', { name: `${title} 핵심 기술` })
      const experienceSkills = within(group as HTMLElement).getByRole('region', { name: `${title} 경험 기술` })

      expect(within(primarySkills).getAllByRole('listitem').map((item) => item.textContent)).toEqual(primary)
      expect(within(experienceSkills).getAllByRole('listitem').map((item) => item.textContent)).toEqual(experience)
    })
  })

  it('renders exactly four skill groups', () => {
    render(<App />)

    const skillsSection = screen.getByRole('region', { name: 'Skills' })

    expect(within(skillsSection).getAllByRole('article')).toHaveLength(4)
  })
})
