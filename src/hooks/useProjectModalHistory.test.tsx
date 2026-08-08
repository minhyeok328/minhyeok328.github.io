import { act, render, waitFor } from '@testing-library/react'
import { createMemoryRouter, type InitialEntry } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'
import { portfolioData } from '../data/portfolio'
import { getOrderedProjects } from '../lib/projects'
import type { PortfolioLocationState } from '../router/modalHistory'
import { useProjectModalHistory } from './useProjectModalHistory'

const projects = getOrderedProjects(portfolioData)

function renderHistory(initialEntries: InitialEntry[] = [{
  pathname: '/',
  state: { unrelated: 'keep-me' },
}]) {
  let current!: ReturnType<typeof useProjectModalHistory>
  const renders: Array<ReturnType<typeof useProjectModalHistory>['modalState']> = []

  function Harness() {
    current = useProjectModalHistory({ projects, sessionToken: 'current' })
    renders.push(current.modalState)
    return null
  }

  const router = createMemoryRouter([
    { path: '/', element: <Harness /> },
  ], {
    initialEntries,
    initialIndex: initialEntries.length - 1,
  })

  render(<RouterProvider router={router} />)

  return { router, renders, get current() { return current } }
}

function portfolioState(state: unknown) {
  return (state as { portfolioModal: PortfolioLocationState }).portfolioModal
}

describe('useProjectModalHistory', () => {
  it('replaces missing modal state with a current-session home state', async () => {
    const history = renderHistory()

    await waitFor(() => {
      expect(history.router.state.location.state).toEqual({
        unrelated: 'keep-me',
        portfolioModal: {
          view: 'home',
          sessionToken: 'current',
          openingCardId: null,
          homeScrollY: null,
        },
      })
    })
    expect(history.current.modalState).toMatchObject({ view: 'home' })
    expect(history.current.activeProject).toBeNull()
  })

  it('replaces home provenance before pushing the opening project', async () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(640)
    const history = renderHistory()
    const transitions: PortfolioLocationState[] = []
    const unsubscribe = history.router.subscribe((state) => {
      transitions.push(portfolioState(state.location.state))
    })

    await waitFor(() => expect(history.current.modalState?.view).toBe('home'))
    transitions.length = 0

    await act(async () => {
      await history.current.openProject('pickle')
    })
    unsubscribe()

    expect(transitions).toEqual([
      {
        view: 'home',
        sessionToken: 'current',
        openingCardId: 'project-card-pickle',
        homeScrollY: 640,
      },
      {
        view: 'project',
        sessionToken: 'current',
        projectId: 'pickle',
        openingCardId: 'project-card-pickle',
        homeScrollY: 640,
        depth: 1,
      },
    ])
    expect(history.router.state.location.pathname).toBe('/')
    expect(history.router.state.location.state).toMatchObject({ unrelated: 'keep-me' })
    expect(history.current.activeProject?.id).toBe('pickle')
    expect(history.current.previousProject?.id).toBe('bank-churners')
    expect(history.current.nextProject?.id).toBe('lg-home-ai')
  })

  it('pushes project switches while preserving the opening home entry', async () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(640)
    const history = renderHistory()
    await waitFor(() => expect(history.current.modalState?.view).toBe('home'))

    await act(async () => {
      await history.current.openProject('pickle')
    })
    await act(async () => {
      await history.current.switchProject('lg-home-ai')
    })

    expect(history.current.modalState).toEqual({
      view: 'project',
      sessionToken: 'current',
      projectId: 'lg-home-ai',
      openingCardId: 'project-card-pickle',
      homeScrollY: 640,
      depth: 2,
    })
    expect(history.current.activeProject?.id).toBe('lg-home-ai')
    expect(history.current.previousProject?.id).toBe('pickle')
    expect(history.current.nextProject?.id).toBe('humour')

    await act(async () => {
      await history.router.navigate(-2)
    })
    expect(history.router.state.location.state).toEqual({
      unrelated: 'keep-me',
      portfolioModal: {
        view: 'home',
        sessionToken: 'current',
        openingCardId: 'project-card-pickle',
        homeScrollY: 640,
      },
    })
  })

  it('returns through the prior project and then home on Back', async () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(640)
    const history = renderHistory()
    await waitFor(() => expect(history.current.modalState?.view).toBe('home'))
    await act(async () => {
      await history.current.openProject('pickle')
    })
    await act(async () => {
      await history.current.switchProject('lg-home-ai')
    })

    await act(async () => {
      await history.router.navigate(-1)
    })
    expect(history.current.activeProject?.id).toBe('pickle')
    expect(history.current.modalState).toMatchObject({ projectId: 'pickle', depth: 1 })

    await act(async () => {
      await history.router.navigate(-1)
    })
    expect(history.current.modalState).toEqual({
      view: 'home',
      sessionToken: 'current',
      openingCardId: 'project-card-pickle',
      homeScrollY: 640,
    })
    expect(history.current.activeProject).toBeNull()
  })

  it('closes depth two directly onto the opening home entry', async () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(640)
    const history = renderHistory()
    await waitFor(() => expect(history.current.modalState?.view).toBe('home'))
    await act(async () => {
      await history.current.openProject('pickle')
    })
    await act(async () => {
      await history.current.switchProject('lg-home-ai')
    })
    await act(async () => {
      await history.current.closeProject()
    })

    expect(history.current.modalState).toEqual({
      view: 'home',
      sessionToken: 'current',
      openingCardId: 'project-card-pickle',
      homeScrollY: 640,
    })
    expect(history.router.state.location.state).toMatchObject({ unrelated: 'keep-me' })

    await act(async () => {
      await history.router.navigate(1)
    })
    expect(history.current.activeProject?.id).toBe('pickle')
  })

  it.each([
    ['stale', {
      view: 'project', sessionToken: 'old', projectId: 'pickle',
      openingCardId: 'project-card-pickle', homeScrollY: 640, depth: 1,
    }],
    ['invalid-depth', {
      view: 'project', sessionToken: 'current', projectId: 'pickle',
      openingCardId: 'project-card-pickle', homeScrollY: 640, depth: 99.5,
    }],
    ['unknown-project', {
      view: 'project', sessionToken: 'current', projectId: 'missing',
      openingCardId: 'project-card-missing', homeScrollY: 640, depth: 99,
    }],
  ])('replaces %s state in place and does not close with its depth', async (_name, invalidState) => {
    const history = renderHistory([
      { pathname: '/', state: { entry: 'prior' } },
      {
        pathname: '/',
        state: { entry: 'current', portfolioModal: invalidState },
      },
    ])

    expect(history.renders[0]).toBeNull()
    expect(history.current.modalState?.view).toBe('home')
    expect(history.current.activeProject).toBeNull()
    await waitFor(() => {
      expect(history.router.state.location.state).toEqual({
        entry: 'current',
        portfolioModal: {
          view: 'home',
          sessionToken: 'current',
          openingCardId: null,
          homeScrollY: null,
        },
      })
    })

    await act(async () => {
      await history.current.closeProject()
    })
    expect(history.router.state.location.state).toMatchObject({ entry: 'current' })
  })
})
