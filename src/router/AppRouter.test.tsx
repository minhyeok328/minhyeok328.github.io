import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { portfolioData } from '../data/portfolio'
import { appRoutes } from './AppRouter'

function renderRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  return { router, ...render(<RouterProvider router={router} />) }
}

describe('AppRouter', () => {
  let scrollIntoView: ReturnType<typeof vi.fn>

  beforeEach(() => {
    window.history.replaceState(null, '', '/')
    scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
  })

  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
  })

  it.each([
    ['/projects/humour/', 'HumouR', 'https://github.com/minhyeok328/Final_project'],
    ['/projects/vehicle-tco/', '차량 운영·관리 비용 계산 시스템', 'https://github.com/minhyeok328/1st_project'],
    ['/projects/bank-churners/', '신용카드 고객 이탈 분석', 'https://github.com/minhyeok328/2nd_project'],
    ['/projects/pickle/', 'PICKLE 맛집 추천 챗봇', 'https://github.com/minhyeok328/3rd_project'],
    ['/projects/lg-home-ai/', 'LG Home AI 가전 상담', 'https://github.com/minhyeok328/4th_project'],
  ])('renders %s with its matching project and repository', (path, title, repository) => {
    renderRoute(path)

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    const codeLink = screen.getByRole('link', { name: 'GitHub에서 코드 보기' })
    expect(codeLink).toHaveAttribute('href', repository)
    expect(codeLink).toHaveAttribute('target', '_blank')
    expect(codeLink).toHaveAttribute('rel', 'noreferrer')
  })

  it('uses nested-safe detail header destinations and the one repository action', () => {
    renderRoute('/projects/humour/')

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/#projects')
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/minhyeok328',
    )
    expect(screen.getByRole('link', { name: 'GitHub에서 코드 보기' })).toHaveAttribute(
      'href',
      'https://github.com/minhyeok328/Final_project',
    )
  })

  it('applies project metadata on direct detail entry', () => {
    renderRoute('/projects/humour/')

    expect(document.title).toBe('HumouR | 서민혁 포트폴리오')
    expect(document.getElementById('page-description')).toHaveAttribute(
      'content',
      '기업 정보, 채용 공고, 지원서 분석, 리포트, 면접 질문과 문서 챗을 하나의 흐름으로 연결한 AI 기반 채용 운영 서비스입니다.',
    )
    expect(document.getElementById('page-og-url')).toHaveAttribute(
      'content',
      'https://minhyeok328.github.io/projects/humour/',
    )
  })

  it('replaces metadata across detail-to-detail and detail-to-home navigation', async () => {
    const { router } = renderRoute('/projects/humour/')

    await act(async () => {
      await router.navigate('/projects/pickle/')
    })
    expect(document.title).toBe('PICKLE 맛집 추천 챗봇 | 서민혁 포트폴리오')
    expect(document.getElementById('page-description')).toHaveAttribute(
      'content',
      portfolioData.journeyProjects[2].description,
    )
    expect(document.getElementById('page-og-url')).toHaveAttribute(
      'content',
      'https://minhyeok328.github.io/projects/pickle/',
    )

    await act(async () => {
      await router.navigate('/')
    })
    expect(document.title).toBe('서민혁 | 프론트엔드 강점을 가진 AI 풀스택 개발자')
    expect(document.getElementById('page-og-url')).toHaveAttribute(
      'content',
      'https://minhyeok328.github.io/',
    )
  })

  it('moves HumouR contribution and team-system depth from the card to its detail page', () => {
    renderRoute('/projects/humour/')

    const contribution = screen.getByRole('region', { name: '직접 기여' })
    const teamTechnologies = screen.getByRole('region', { name: '팀 시스템 연동' })

    expect(screen.getAllByText(portfolioData.flagshipProject.contribution[0])).toHaveLength(1)
    expect(within(contribution).getAllByRole('listitem').map((item) => item.textContent)).toEqual(
      portfolioData.flagshipProject.contribution.slice(1),
    )
    expect(within(teamTechnologies).getAllByRole('listitem').map((item) => item.textContent)).toEqual(
      portfolioData.flagshipProject.teamTechnologies,
    )
  })

  it('focuses the project heading without adding it to the Tab order', () => {
    renderRoute('/projects/pickle/')

    const heading = screen.getByRole('heading', { level: 1, name: 'PICKLE 맛집 추천 챗봇' })
    expect(document.activeElement).toBe(heading)
    expect(heading).toHaveAttribute('tabindex', '-1')
  })

  it('scrolls an initial home hash after the Projects section exists', () => {
    renderRoute('/#projects')

    expect(scrollIntoView).toHaveBeenCalled()
  })

  it('handles the explicit project-list PUSH through ScrollRestoration', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/projects/humour/')
    scrollIntoView.mockClear()

    await user.click(screen.getByRole('link', { name: '프로젝트 목록' }))

    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.hash).toBe('#projects')
    expect(scrollIntoView).toHaveBeenCalled()
  })

  it('restores a saved home position on POP without forcing the hash target', async () => {
    let currentScrollY = 640
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => currentScrollY)
    const { router } = renderRoute('/#projects')
    const scrollTo = vi.mocked(window.scrollTo)
    scrollIntoView.mockClear()

    await act(async () => {
      await router.navigate('/projects/humour/')
    })
    currentScrollY = 120
    scrollIntoView.mockClear()
    scrollTo.mockClear()

    await act(async () => {
      await router.navigate(-1)
    })

    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.hash).toBe('#projects')
    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(scrollTo).toHaveBeenCalledWith(0, 640)
  })

  it('renders not found for an unknown project id and an unknown path', () => {
    const first = renderRoute('/projects/missing/')
    expect(screen.getByRole('heading', { name: '페이지를 찾을 수 없습니다.' })).toBeInTheDocument()
    first.unmount()

    renderRoute('/missing/')
    expect(screen.getByRole('heading', { name: '페이지를 찾을 수 없습니다.' })).toBeInTheDocument()
  })
})
