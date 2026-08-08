import type { PortfolioData, Project } from '../types/portfolio'

export interface AdjacentProjects {
  previous: Project | null
  next: Project | null
}

export function getOrderedProjects(
  data: Pick<PortfolioData, 'flagshipProject' | 'journeyProjects'>,
) {
  return [...data.journeyProjects, data.flagshipProject]
    .sort((left, right) => left.order - right.order)
}

export function findProjectById(projects: readonly Project[], id: string | undefined) {
  return id ? projects.find((project) => project.id === id) : undefined
}

export function getAdjacentProjects(
  projects: readonly Project[],
  id: string,
): AdjacentProjects {
  const index = projects.findIndex((project) => project.id === id)

  if (index < 0) {
    return { previous: null, next: null }
  }

  return {
    previous: projects[index - 1] ?? null,
    next: projects[index + 1] ?? null,
  }
}

export function getProjectRoleSummary(
  project: Pick<Project, 'cardRoleSummary' | 'contribution'>,
) {
  return project.cardRoleSummary?.trim() || project.contribution[0] || ''
}

export function getProjectContributionItems(
  project: Pick<Project, 'cardRoleSummary' | 'contribution'>,
) {
  return project.cardRoleSummary?.trim()
    ? project.contribution
    : project.contribution.slice(1)
}
