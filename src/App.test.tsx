import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the approved portfolio positioning', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '서민혁입니다.' })).toBeInTheDocument()
    expect(screen.getByText('프론트엔드 강점을 가진 AI 풀스택 개발자')).toBeInTheDocument()
  })

  it('always links to Projects from the hero while omitting an unavailable resume', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: '프로젝트 보기' })).toHaveAttribute('href', '#projects')
    expect(screen.queryByRole('link', { name: '이력서 다운로드' })).not.toBeInTheDocument()
  })

  it('keeps Contact details out of the Hero and renders them in Contact', () => {
    render(<App />)

    const heroSocials = screen.getByRole('navigation', { name: '소셜 링크' })
    const contact = screen.getByRole('region', { name: 'Contact' })
    const githubLinks = screen.getAllByRole('link', { name: 'GitHub 보기' })
    const contactLinks = within(contact).getAllByRole('link')

    expect(githubLinks).toHaveLength(2)
    githubLinks.forEach((githubLink) => {
      expect(githubLink).toHaveAttribute('href', 'https://github.com/minhyeok328')
      expect(githubLink).toHaveAttribute('target', '_blank')
      expect(githubLink).toHaveAttribute('rel', 'noreferrer')
    })
    expect(within(heroSocials).getAllByRole('link').map((link) => link.textContent)).toEqual(['GitHub 보기'])
    expect(contactLinks.map((link) => link.textContent)).toEqual([
      'GitHub 보기',
      '블로그 보기',
      'Email 보내기',
    ])
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
    expect(screen.getByText('AI Full-Stack')).toBeInTheDocument()
  })

  it('links every project to its verified GitHub repository', () => {
    render(<App />)

    expect(screen.getAllByRole('link', { name: 'GitHub에서 보기' })).toHaveLength(5)
  })
  it('keeps the flagship and journey GitHub links in verified display order', () => {
    render(<App />)

    const projectCards = [
      screen.getByTestId('flagship-project'),
      ...screen.getAllByTestId('journey-project'),
    ]

    expect(projectCards.map((card) => (
      within(card).getByRole('link', { name: 'GitHub에서 보기' }).getAttribute('href')
    ))).toEqual([
      'https://github.com/minhyeok328/Final_project',
      'https://github.com/minhyeok328/1st_project',
      'https://github.com/minhyeok328/2nd_project',
      'https://github.com/minhyeok328/3rd_project',
      'https://github.com/minhyeok328/4th_project',
    ])
  })

  it('uses accessible placeholders instead of empty project image sources', () => {
    const { container } = render(<App />)

    expect(screen.getAllByRole('img', { name: /프로젝트 이미지 대체$/ })).toHaveLength(5)
    expect(container.querySelectorAll('img[src=""]')).toHaveLength(0)
  })

  it('shows contribution, growth, and technologies for every journey project', () => {
    render(<App />)

    screen.getAllByTestId('journey-project').forEach((card) => {
      const cardScope = within(card)

      expect(cardScope.getByRole('heading', { level: 4, name: '직접 기여' })).toBeInTheDocument()
      expect(cardScope.getByText('성장')).toBeInTheDocument()
      expect(cardScope.getByRole('heading', { level: 4, name: '기술' })).toBeInTheDocument()
      expect(cardScope.getAllByRole('list')).toHaveLength(2)
      cardScope.getAllByRole('list').forEach((list) => {
        expect(within(list).getAllByRole('listitem').length).toBeGreaterThan(0)
      })
    })
  })

  it('presents the five growth stages in order', () => {
    render(<App />)

    const growthLine = screen.getByRole('navigation', { name: '프로젝트 성장 단계' })

    expect(within(growthLine).getAllByRole('link').map((link) => link.textContent)).toEqual([
      '1단계 · Data Integration',
      '2단계 · ML Experimentation',
      '3단계 · LLM & RAG',
      '4단계 · Web Integration',
      '5단계 · AI Full-Stack',
    ])
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
        experience: ['Docker', 'GitHub Actions', 'AWS deployment configuration'],
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
  it('keeps the flagship contribution, growth, and technology content distinct', () => {
    render(<App />)

    const flagship = within(screen.getByTestId('flagship-project'))
    const contribution = flagship.getByRole('region', { name: '직접 기여' })
    const technologies = flagship.getByRole('region', { name: '핵심 기술' })

    expect(flagship.getByText('성장')).toBeInTheDocument()
    expect(within(contribution).getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(within(technologies).getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(contribution).not.toBe(technologies)
    expect(contribution).not.toContainElement(technologies)
    expect(technologies).not.toContainElement(contribution)
  })

  it('renders all six approved HumouR direct contributions', () => {
    render(<App />)

    const flagship = within(screen.getByTestId('flagship-project'))
    const contribution = flagship.getByRole('region', { name: '직접 기여' })

    expect(within(contribution).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '프론트엔드 CODEOWNER로서 React·TypeScript 애플리케이션 구조와 통합 품질 주도',
      'Axios·CSRF, API Client, Zod 계약, Adapter, TanStack Query로 이어지는 데이터 흐름 설계',
      '일반 계정과 제한 API Key 세션의 권한·캐시 경계 처리',
      '인증 만료, 요청 취소, 오류 정제, 캐시 정리 등 요청 수명주기 안정화',
      'JD·지원서·분석 리포트·공유·문서 챗의 API 연동과 통합 검증',
      '프론트엔드 테스트, QA, 문서 정합성 관리',
    ])
  })

  it('separates HumouR core technologies from the exact team-system list', () => {
    render(<App />)

    const flagship = within(screen.getByTestId('flagship-project'))
    const coreTechnologies = flagship.getByRole('region', { name: '핵심 기술' })
    const teamSystems = flagship.getByRole('region', { name: '팀 시스템 연동' })

    expect(within(coreTechnologies).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'React 19',
      'TypeScript',
      'TanStack Query',
      'Zod',
    ])
    expect(within(teamSystems).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Django',
      'Celery',
      'LangGraph',
      'Pinecone',
      'AWS',
    ])
  })

  it('renders exactly four skill groups', () => {
    render(<App />)

    const skillsSection = screen.getByRole('region', { name: 'Skills' })

    expect(within(skillsSection).getAllByRole('article')).toHaveLength(4)
  })
})
