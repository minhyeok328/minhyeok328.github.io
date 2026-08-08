import { describe, expect, it } from 'vitest'
import {
  createHomeLocationState,
  createPageSessionToken,
  createProjectLocationState,
  normalizeInitialBrowserEntry,
  parsePortfolioLocationState,
} from './modalHistory'

describe('modal history state', () => {
  it('normalizes a legacy browser entry without discarding Router history state', () => {
    window.history.replaceState({
      idx: 7,
      key: 'router-key',
      usr: {
        portfolioModal: { view: 'project' },
        unrelated: 'keep-me',
      },
      envelopeExtra: { preserved: true },
    }, '', '/projects/pickle/#journey')

    normalizeInitialBrowserEntry(window)

    expect(window.location.pathname).toBe('/')
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('')
    expect(window.history.state).toEqual({
      idx: 7,
      key: 'router-key',
      usr: { unrelated: 'keep-me' },
      envelopeExtra: { preserved: true },
    })
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
  })

  it('preserves a non-object history state while normalizing the address', () => {
    window.history.replaceState(null, '', '/missing/?from=legacy#projects')

    normalizeInitialBrowserEntry(window)

    expect(window.location.href).toBe(`${window.location.origin}/`)
    expect(window.history.state).toBeNull()
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
  })

  it('parses a valid current-session project state from its namespace', () => {
    expect(parsePortfolioLocationState({
      unrelated: 'keep-me',
      portfolioModal: {
        view: 'project',
        sessionToken: 'current',
        projectId: 'pickle',
        openingCardId: 'project-card-pickle',
        homeScrollY: 640,
        depth: 2,
      },
    }, 'current', ['pickle'])).toEqual({
      view: 'project',
      sessionToken: 'current',
      projectId: 'pickle',
      openingCardId: 'project-card-pickle',
      homeScrollY: 640,
      depth: 2,
    })
  })

  it('rejects project state from another page session', () => {
    expect(parsePortfolioLocationState({
      portfolioModal: {
        view: 'project',
        sessionToken: 'old',
        projectId: 'pickle',
        openingCardId: 'project-card-pickle',
        homeScrollY: 640,
        depth: 1,
      },
    }, 'current', ['pickle'])).toBeNull()
  })

  it('rejects an unknown project id', () => {
    expect(parsePortfolioLocationState({
      portfolioModal: {
        view: 'project',
        sessionToken: 'current',
        projectId: 'missing',
        openingCardId: 'project-card-missing',
        homeScrollY: 640,
        depth: 1,
      },
    }, 'current', ['pickle'])).toBeNull()
  })

  it('rejects a blank project opening-card id', () => {
    expect(parsePortfolioLocationState({
      portfolioModal: {
        view: 'project',
        sessionToken: 'current',
        projectId: 'pickle',
        openingCardId: '   ',
        homeScrollY: 640,
        depth: 1,
      },
    }, 'current', ['pickle'])).toBeNull()
  })

  it('rejects negative and non-finite project scroll positions', () => {
    const state = {
      view: 'project',
      sessionToken: 'current',
      projectId: 'pickle',
      openingCardId: 'project-card-pickle',
      depth: 1,
    }

    expect(parsePortfolioLocationState({
      portfolioModal: { ...state, homeScrollY: -1 },
    }, 'current', ['pickle'])).toBeNull()
    expect(parsePortfolioLocationState({
      portfolioModal: { ...state, homeScrollY: Number.POSITIVE_INFINITY },
    }, 'current', ['pickle'])).toBeNull()
  })

  it('rejects zero and fractional modal depths', () => {
    const state = {
      view: 'project',
      sessionToken: 'current',
      projectId: 'pickle',
      openingCardId: 'project-card-pickle',
      homeScrollY: 640,
    }

    expect(parsePortfolioLocationState({
      portfolioModal: { ...state, depth: 0 },
    }, 'current', ['pickle'])).toBeNull()
    expect(parsePortfolioLocationState({
      portfolioModal: { ...state, depth: 1.5 },
    }, 'current', ['pickle'])).toBeNull()
  })

  it('parses valid fresh and restorable home states', () => {
    expect(parsePortfolioLocationState({
      portfolioModal: {
        view: 'home',
        sessionToken: 'current',
        openingCardId: null,
        homeScrollY: null,
      },
    }, 'current', ['pickle'])).toEqual({
      view: 'home',
      sessionToken: 'current',
      openingCardId: null,
      homeScrollY: null,
    })
    expect(parsePortfolioLocationState({
      unrelated: { preserved: true },
      portfolioModal: {
        view: 'home',
        sessionToken: 'current',
        openingCardId: 'project-card-pickle',
        homeScrollY: 640,
      },
    }, 'current', ['pickle'])).toEqual({
      view: 'home',
      sessionToken: 'current',
      openingCardId: 'project-card-pickle',
      homeScrollY: 640,
    })
  })

  it('creates exact home and project payloads', () => {
    expect(createHomeLocationState('current')).toEqual({
      view: 'home',
      sessionToken: 'current',
      openingCardId: null,
      homeScrollY: null,
    })
    expect(createHomeLocationState('current', {
      openingCardId: 'project-card-pickle',
      homeScrollY: 640,
    })).toEqual({
      view: 'home',
      sessionToken: 'current',
      openingCardId: 'project-card-pickle',
      homeScrollY: 640,
    })
    expect(createProjectLocationState(
      'current',
      'pickle',
      'project-card-pickle',
      640,
      2,
    )).toEqual({
      view: 'project',
      sessionToken: 'current',
      projectId: 'pickle',
      openingCardId: 'project-card-pickle',
      homeScrollY: 640,
      depth: 2,
    })
  })

  it('generates a distinct non-blank token for each page session', () => {
    const first = createPageSessionToken()
    const second = createPageSessionToken()

    expect(first).not.toBe('')
    expect(second).not.toBe('')
    expect(first).not.toBe(second)
  })
})
