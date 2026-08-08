export interface HomeLocationState {
  view: 'home'
  sessionToken: string
  openingCardId: string | null
  homeScrollY: number | null
}

export interface ProjectLocationState {
  view: 'project'
  sessionToken: string
  projectId: string
  openingCardId: string
  homeScrollY: number
  depth: number
}

export type PortfolioLocationState = HomeLocationState | ProjectLocationState

let fallbackTokenSequence = 0

export function createPageSessionToken() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  fallbackTokenSequence += 1
  return `portfolio-session-${Date.now()}-${fallbackTokenSequence}`
}

export function createHomeLocationState(
  sessionToken: string,
  restore?: { openingCardId: string; homeScrollY: number },
): HomeLocationState {
  return {
    view: 'home',
    sessionToken,
    openingCardId: restore?.openingCardId ?? null,
    homeScrollY: restore?.homeScrollY ?? null,
  }
}

export function createProjectLocationState(
  sessionToken: string,
  projectId: string,
  openingCardId: string,
  homeScrollY: number,
  depth: number,
): ProjectLocationState {
  return {
    view: 'project',
    sessionToken,
    projectId,
    openingCardId,
    homeScrollY,
    depth,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidScrollPosition(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function parsePortfolioLocationState(
  locationState: unknown,
  sessionToken: string,
  projectIds: readonly string[],
): PortfolioLocationState | null {
  if (!isRecord(locationState) || !isRecord(locationState.portfolioModal)) {
    return null
  }

  const state = locationState.portfolioModal
  if (state.sessionToken !== sessionToken) {
    return null
  }

  if (state.view === 'home') {
    const hasFreshHomeState = state.openingCardId === null && state.homeScrollY === null
    const hasRestorableHomeState = isNonBlankString(state.openingCardId)
      && isValidScrollPosition(state.homeScrollY)

    if (!hasFreshHomeState && !hasRestorableHomeState) {
      return null
    }

    return {
      view: 'home',
      sessionToken,
      openingCardId: state.openingCardId as string | null,
      homeScrollY: state.homeScrollY as number | null,
    }
  }

  if (
    state.view !== 'project'
    || !isNonBlankString(state.projectId)
    || !projectIds.includes(state.projectId)
    || !isNonBlankString(state.openingCardId)
    || !isValidScrollPosition(state.homeScrollY)
    || typeof state.depth !== 'number'
    || !Number.isInteger(state.depth)
    || state.depth <= 0
  ) {
    return null
  }

  return {
    view: 'project',
    sessionToken,
    projectId: state.projectId,
    openingCardId: state.openingCardId,
    homeScrollY: state.homeScrollY,
    depth: state.depth,
  }
}
