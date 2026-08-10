import type { RefObject } from 'react'
import type { Project } from '../../types/portfolio'
import { ProjectImage } from '../ProjectImage'
import { ProjectActions } from './ProjectActions'

interface DetailHeroProps {
  project: Project
  headingRef: RefObject<HTMLHeadingElement | null>
}

export function DetailHero({ project, headingRef }: DetailHeroProps) {
  return (
    <section className="project-detail__hero" aria-labelledby="project-detail-heading">
      <div className="project-detail__hero-copy">
        <p className="project-detail__stage">{project.stage}</p>
        <h1 id="project-detail-heading" ref={headingRef} tabIndex={-1}>{project.title}</h1>
        <p className="project-detail__description">{project.description}</p>
        <ProjectActions githubUrl={project.githubUrl} />
      </div>
      <ProjectImage
        project={project}
        className="project-detail__image"
        fallbackClassName="project-detail__image-placeholder"
      />
    </section>
  )
}
