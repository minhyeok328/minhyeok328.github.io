import { getProjectRoleSummary } from '../lib/projects'
import type { Project } from '../types/portfolio'
import { ProjectImage } from './ProjectImage'

interface ProjectCardProps {
  project: Project
  variant: 'flagship' | 'journey'
  onOpenProject: (projectId: string) => void
}

export function ProjectCard({ project, variant, onOpenProject }: ProjectCardProps) {
  const roleSummary = getProjectRoleSummary(project)
  const technologyLimit = variant === 'flagship' ? 4 : 2
  const visibleTechnologies = project.technologies.slice(0, technologyLimit)

  return (
    <article
      id={project.id}
      className={`project-card project-card--${variant}${variant === 'flagship' ? ' flagship-project' : ''}`}
      data-testid={variant === 'flagship' ? 'flagship-project' : 'journey-project'}
    >
      <button
        id={`project-card-trigger-${project.id}`}
        className="project-card__trigger"
        type="button"
        aria-haspopup="dialog"
        aria-label={`${project.title} 프로젝트 상세 보기`}
        onClick={() => onOpenProject(project.id)}
      />
      <div className="project-card__visual">
        <ProjectImage
          project={project}
          className="project-card__image"
          fallbackClassName="project-card__image-placeholder"
          loading={variant === 'flagship' ? 'eager' : 'lazy'}
          decoding="async"
        />

        <div className="project-card__content">
          <div className="project-card__meta">
            <p className="project-card__stage">{project.stage}</p>
            <time>{project.period}</time>
          </div>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <p className="project-card__role">
            <strong>내 역할</strong>
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
      </div>
    </article>
  )
}
