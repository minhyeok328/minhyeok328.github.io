import { describe, expect, it } from 'vitest'
import {
  createHomeLocationState,
  createPageSessionToken,
  createProjectLocationState,
  parsePortfolioLocationState,
} from './modalHistory'

describe('modal history state', () => {
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
