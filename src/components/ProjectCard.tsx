import { Link } from 'react-router'
import { getProjectPath, getProjectRoleSummary } from '../lib/projects'
import type { Project } from '../types/portfolio'
import { ProjectImage } from './ProjectImage'

interface ProjectCardProps {
  project: Project
  variant: 'flagship' | 'journey'
}

export function ProjectCard({ project, variant }: ProjectCardProps) {
  const roleSummary = getProjectRoleSummary(project)
  const technologyLimit = variant === 'flagship' ? 4 : 2
  const visibleTechnologies = project.technologies.slice(0, technologyLimit)

  return (
    <article
      id={project.id}
      className={`project-card project-card--${variant}${variant === 'flagship' ? ' flagship-project' : ''}`}
      data-testid={variant === 'flagship' ? 'flagship-project' : 'journey-project'}
    >
      <Link
        className="project-card__link"
        to={getProjectPath(project)}
        aria-label={`${project.title} 상세 페이지 보기`}
      >
        <ProjectImage
          project={project}
          className="project-card__image"
          fallbackClassName="project-card__image-placeholder"
        />

        <div className="project-card__content">
          <p className="project-card__stage">{project.stage}</p>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <p className="project-card__role">
            <strong>역할</strong>
            <span>{roleSummary}</span>
          </p>
          <ul
            className="project-card__technology-list"
            aria-label={`${project.title} 주요 기술`}
          >
            {visibleTechnologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        </div>
      </Link>
    </article>
  )
}
