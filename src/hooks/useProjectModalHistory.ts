import { useCallback, useLayoutEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { findProjectById, getAdjacentProjects } from '../lib/projects'
import {
  createHomeLocationState,
  createProjectLocationState,
  parsePortfolioLocationState,
  type PortfolioLocationState,
} from '../router/modalHistory'
import type { Project } from '../types/portfolio'

interface UseProjectModalHistoryOptions {
  projects: readonly Project[]
  sessionToken: string
}

function mergePortfolioState(
  locationState: unknown,
  portfolioModal: PortfolioLocationState,
) {
  const userState = typeof locationState === 'object'
    && locationState !== null
    && !Array.isArray(locationState)
    ? locationState
    : {}

  return { ...userState, portfolioModal }
}

export function useProjectModalHistory({
  projects,
  sessionToken,
}: UseProjectModalHistoryOptions) {
  const location = useLocation()
  const navigate = useNavigate()
  const projectIds = useMemo(
    () => projects.map((project) => project.id),
    [projects],
  )
  const modalState = parsePortfolioLocationState(
    location.state,
    sessionToken,
    projectIds,
  )
  const activeProject = modalState?.view === 'project'
    ? findProjectById(projects, modalState.projectId) ?? null
    : null
  const adjacentProjects = activeProject
    ? getAdjacentProjects(projects, activeProject.id)
    : { previous: null, next: null }

  useLayoutEffect(() => {
    if (modalState !== null) {
      return
    }

    void navigate('/', {
      replace: true,
      state: mergePortfolioState(
        location.state,
        createHomeLocationState(sessionToken),
      ),
    })
  }, [location.state, modalState, navigate, sessionToken])

  const openProject = useCallback(async (projectId: string) => {
    if (modalState?.view !== 'home' || !findProjectById(projects, projectId)) {
      return
    }

    const openingCardId = `project-card-trigger-${projectId}`
    const homeScrollY = window.scrollY
    const restore = { openingCardId, homeScrollY }

    await navigate('/', {
      replace: true,
      state: mergePortfolioState(
        location.state,
        createHomeLocationState(sessionToken, restore),
      ),
    })
    await navigate('/', {
      state: mergePortfolioState(
        location.state,
        createProjectLocationState(
          sessionToken,
          projectId,
          openingCardId,
          homeScrollY,
          1,
        ),
      ),
    })
  }, [location.state, modalState, navigate, projects, sessionToken])

  const switchProject = useCallback(async (projectId: string) => {
    if (modalState?.view !== 'project' || !findProjectById(projects, projectId)) {
      return
    }

    await navigate('/', {
      state: mergePortfolioState(
        location.state,
        createProjectLocationState(
          sessionToken,
          projectId,
          modalState.openingCardId,
          modalState.homeScrollY,
          modalState.depth + 1,
        ),
      ),
    })
  }, [location.state, modalState, navigate, projects, sessionToken])

  const closeProject = useCallback(async () => {
    if (modalState?.view !== 'project') {
      return
    }

    await navigate(-modalState.depth)
  }, [modalState, navigate])

  return {
    modalState,
    activeProject,
    previousProject: adjacentProjects.previous,
    nextProject: adjacentProjects.next,
    openProject,
    switchProject,
    closeProject,
  }
}
