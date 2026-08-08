import type { RefObject } from 'react'
import { Link } from 'react-router'
import {
  getProjectContributionItems,
  getProjectPath,
  getProjectRoleSummary,
} from '../../lib/projects'
import type { Project } from '../../types/portfolio'
import { ContributionSection } from './ContributionSection'
import { DetailHero } from './DetailHero'
import { OverviewSection } from './OverviewSection'
import { QuickSummary } from './QuickSummary'
import { RetrospectiveSection } from './RetrospectiveSection'
import { TechnicalSection } from './TechnicalSection'

interface ProjectDetailViewProps {
  project: Project
  previousProject: Project | null
  nextProject: Project | null
  headingRef: RefObject<HTMLHeadingElement | null>
}

export function ProjectDetailView({
  project,
  previousProject,
  nextProject,
  headingRef,
}: ProjectDetailViewProps) {
  const roleSummary = getProjectRoleSummary(project)
  const contributionItems = getProjectContributionItems(project)

  return (
    <article className="project-detail">
      <DetailHero project={project} headingRef={headingRef} />
      <QuickSummary project={project} roleSummary={roleSummary} />
      <OverviewSection paragraphs={project.detail?.overview ?? []} />
      <ContributionSection items={contributionItems} />
      <TechnicalSection project={project} />
      <RetrospectiveSection paragraphs={project.detail?.retrospective ?? []} />

      <nav className="project-detail__project-navigation" aria-label="다른 프로젝트">
        {previousProject ? (
          <Link to={getProjectPath(previousProject)}>이전 · {previousProject.title}</Link>
        ) : <span />}
        {nextProject ? (
          <Link to={getProjectPath(nextProject)}>다음 · {nextProject.title}</Link>
        ) : <span />}
      </nav>
    </article>
  )
}
