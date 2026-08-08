import { useEffect, useRef } from 'react'
import { useParams } from 'react-router'
import { DocumentMetadata } from '../components/DocumentMetadata'
import { ProjectDetailLayout } from '../components/project-detail/ProjectDetailLayout'
import { ProjectDetailView } from '../components/project-detail/ProjectDetailView'
import { portfolioData } from '../data/portfolio'
import { getProjectMetadata } from '../lib/projectMetadata'
import { findProjectById, getAdjacentProjects, getOrderedProjects } from '../lib/projects'
import type { Project } from '../types/portfolio'
import { NotFoundPage } from './NotFoundPage'

const projects = getOrderedProjects(portfolioData)

function ResolvedProjectDetailPage({ project }: { project: Project }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const metadata = getProjectMetadata(project, portfolioData.profile)
  const { previous, next } = getAdjacentProjects(projects, project.id)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [project.id])

  return (
    <>
      <DocumentMetadata metadata={metadata} />
      <ProjectDetailLayout
        githubUrl={portfolioData.profile.githubUrl}
        name={portfolioData.profile.name}
      >
        <ProjectDetailView
          project={project}
          previousProject={previous}
          nextProject={next}
          headingRef={headingRef}
        />
      </ProjectDetailLayout>
    </>
  )
}

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const project = findProjectById(projects, projectId)

  return project ? <ResolvedProjectDetailPage project={project} /> : <NotFoundPage />
}
