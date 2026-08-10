import type { RefObject } from 'react'
import {
  getProjectContributionItems,
  getProjectRoleSummary,
} from '../../lib/projects'
import type { Project } from '../../types/portfolio'
import { ContributionSection } from './ContributionSection'
import { DetailHero } from './DetailHero'
import { OverviewSection } from './OverviewSection'
import { ProjectEvidenceSection } from './ProjectEvidenceSection'
import { QuickSummary } from './QuickSummary'
import { RetrospectiveSection } from './RetrospectiveSection'
import { TechnicalSection } from './TechnicalSection'

interface ProjectDetailViewProps {
  project: Project
  previousProject: Project | null
  nextProject: Project | null
  headingRef: RefObject<HTMLHeadingElement | null>
  onPreviousProject?: () => void
  onNextProject?: () => void
}

export function ProjectDetailView({
  project,
  previousProject,
  nextProject,
  headingRef,
  onPreviousProject,
  onNextProject,
}: ProjectDetailViewProps) {
  const roleSummary = getProjectRoleSummary(project)
  const contributionItems = getProjectContributionItems(project)

  return (
    <article className="project-detail">
      <DetailHero project={project} headingRef={headingRef} />
      <QuickSummary project={project} roleSummary={roleSummary} />
      <ProjectEvidenceSection project={project} />
      <OverviewSection paragraphs={project.detail?.overview ?? []} />
      <ContributionSection items={contributionItems} />
      <TechnicalSection project={project} />
      <RetrospectiveSection
        paragraphs={project.detail?.retrospective ?? []}
        growth={project.growth}
      />

      <nav className="project-detail__project-navigation" aria-label="다른 프로젝트">
        {previousProject && onPreviousProject ? (
          <button type="button" onClick={onPreviousProject}>
            이전 · {previousProject.title}
          </button>
        ) : <span />}
        {nextProject && onNextProject ? (
          <button type="button" onClick={onNextProject}>
            다음 · {nextProject.title}
          </button>
        ) : <span />}
      </nav>
    </article>
  )
}
