import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrowserRouter, createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppRoutes } from './AppRouter'
import { normalizeInitialBrowserEntry } from './modalHistory'

function renderRoute(path: string) {
  const router = createMemoryRouter(createAppRoutes('test-session'), { initialEntries: [path] })
  return { router, ...render(<RouterProvider router={router} />) }
}

function expectRootLocation(router: ReturnType<typeof createMemoryRouter>) {
  expect(router.state.location.pathname).toBe('/')
  expect(router.state.location.hash).toBe('')
}

async function openProjectDialog(
  router: ReturnType<typeof createMemoryRouter>,
  title: string,
) {
  await waitFor(() => {
    expect(router.state.location.state).toMatchObject({
      portfolioModal: { view: 'home', sessionToken: 'test-session' },
    })
  })

  const trigger = screen.getByRole('button', {
    name: `${title} 프로젝트 상세 보기`,
  })
  await userEvent.setup().click(trigger)

  return {
    trigger,
    dialog: await screen.findByRole('dialog', { name: title }),
  }
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

  it('declares the home page as the only application route', () => {
    const routes = createAppRoutes('test-session')

    expect(routes).toHaveLength(1)
    expect(routes[0]).toMatchObject({ path: '/' })
    expect(routes[0].children).toBeUndefined()
  })

  it('renders the home route at the root address without a hash target', () => {
    const { router } = renderRoute('/')

    expectRootLocation(router)
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it.each([
    '/projects/pickle/#journey',
    '/#projects',
    '/missing/?from=legacy#unknown',
  ])('normalizes the legacy entry %s before constructing the browser router', async (path) => {
    window.history.replaceState({
      idx: 7,
      key: 'legacy-key',
      usr: {
        unrelated: 'keep-me',
        portfolioModal: {
          view: 'project',
          sessionToken: 'stale-session',
          projectId: 'pickle',
        },
      },
    }, '', path)

    normalizeInitialBrowserEntry(window)
    const router = createBrowserRouter(createAppRoutes('fresh-session'))
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(router.state.location.state).toMatchObject({
        unrelated: 'keep-me',
        portfolioModal: { view: 'home', sessionToken: 'fresh-session' },
      })
    })
    expect(window.location.pathname).toBe('/')
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.title).toBe('서민혁 | 프론트엔드 강점을 가진 AI 풀스택 개발자')
    expect(document.getElementById('page-og-url')).toHaveAttribute(
      'content',
      'https://minhyeok328.github.io/',
    )

    router.dispose()
  })

  it.each([
    ['HumouR'],
    ['차량 운영·관리 비용 계산 시스템'],
    ['신용카드 고객 이탈 분석'],
    ['PICKLE 맛집 추천 챗봇'],
    ['LG Home AI 가전 상담'],
  ])('opens the matching %s dialog while keeping the root URL', async (title) => {
    const { router } = renderRoute('/')

    await openProjectDialog(router, title)

    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.hash).toBe('')
  })

  it('switches previous and next projects without replacing the open dialog', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/')
    const { dialog } = await openProjectDialog(router, 'PICKLE 맛집 추천 챗봇')

    await user.click(screen.getByRole('button', { name: '다음 · LG Home AI 가전 상담' }))
    expect(await screen.findByRole('dialog', { name: 'LG Home AI 가전 상담' })).toBe(dialog)

    await user.click(screen.getByRole('button', { name: '이전 · PICKLE 맛집 추천 챗봇' }))
    expect(await screen.findByRole('dialog', { name: 'PICKLE 맛집 추천 챗봇' })).toBe(dialog)
    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.hash).toBe('')
  })

  it('uses Router Back to return to the prior project and then close', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/')
    await openProjectDialog(router, 'PICKLE 맛집 추천 챗봇')
    expectRootLocation(router)
    await user.click(screen.getByRole('button', { name: '다음 · LG Home AI 가전 상담' }))
    await screen.findByRole('dialog', { name: 'LG Home AI 가전 상담' })
    expectRootLocation(router)

    await act(async () => {
      await router.navigate(-1)
    })
    expect(await screen.findByRole('dialog', { name: 'PICKLE 맛집 추천 챗봇' })).toBeInTheDocument()
    expectRootLocation(router)

    await act(async () => {
      await router.navigate(-1)
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expectRootLocation(router)
  })

  it('closes directly to home from a multi-project history', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/')
    await openProjectDialog(router, 'PICKLE 맛집 추천 챗봇')
    expectRootLocation(router)
    await user.click(screen.getByRole('button', { name: '다음 · LG Home AI 가전 상담' }))
    await screen.findByRole('dialog', { name: 'LG Home AI 가전 상담' })
    expectRootLocation(router)

    await user.click(screen.getByRole('button', { name: '닫기' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expectRootLocation(router)
    expect(router.state.location.state).toMatchObject({
      portfolioModal: { view: 'home', openingCardId: 'project-card-trigger-pickle' },
    })
  })

  it('restores the original home scroll and exact card-trigger focus after close', async () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(640)
    const user = userEvent.setup()
    const { router } = renderRoute('/')
    const { trigger } = await openProjectDialog(router, 'PICKLE 맛집 추천 챗봇')
    vi.mocked(window.scrollTo).mockClear()

    await user.click(screen.getByRole('button', { name: '닫기' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 640, behavior: 'auto' })
    expect(document.activeElement).toBe(trigger)
  })

  it('keeps the repository action safe and omits a project-list action in the dialog', async () => {
    const { router } = renderRoute('/')
    await openProjectDialog(router, 'PICKLE 맛집 추천 챗봇')

    expect(screen.queryByText('프로젝트 목록')).not.toBeInTheDocument()
    const githubAction = screen.getByRole('link', { name: 'GitHub에서 코드 보기' })
    expect(githubAction).toHaveAttribute('href', 'https://github.com/minhyeok328/3rd_project')
    expect(githubAction).toHaveAttribute('target', '_blank')
    expect(githubAction).toHaveAttribute('rel', 'noreferrer')
  })
})
