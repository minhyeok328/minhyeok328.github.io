import { ImageWithFallback } from './ImageWithFallback'
import type { Project } from '../types/portfolio'

interface ProjectCardProps {
  project: Project
  variant: 'flagship' | 'journey'
}

function ProjectImagePlaceholder({ title }: { title: string }) {
  return (
    <div
      className="project-card__image-placeholder"
      role="img"
      aria-label={`${title} 프로젝트 이미지 대체`}
    >
      {title.slice(0, 2)}
    </div>
  )
}

export function ProjectCard({ project, variant }: ProjectCardProps) {
  const contributionHeadingId = `${project.id}-contribution-heading`
  const technologyHeadingId = `${project.id}-technology-heading`
  const teamTechnologyHeadingId = `${project.id}-team-technology-heading`

  return (
    <article
      id={project.id}
      className={`project-card project-card--${variant}${variant === 'flagship' ? ' flagship-project' : ''}`}
      data-testid={variant === 'flagship' ? 'flagship-project' : 'journey-project'}
    >
      {project.image ? (
        <ImageWithFallback
          className="project-card__image"
          fallbackClassName="project-card__image-placeholder"
          src={project.image}
          alt={`${project.title} 프로젝트 이미지`}
          fallback={project.title.slice(0, 2)}
        />
      ) : (
        <ProjectImagePlaceholder title={project.title} />
      )}

      <div className="project-card__content">
        <p className="project-card__stage">{project.stage}</p>
        <h3>{project.title}</h3>
        <p>{project.description}</p>

        <section className="project-card__contribution" aria-labelledby={contributionHeadingId}>
          <h4 id={contributionHeadingId}>직접 기여</h4>
          <ul>
            {project.contribution.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <p className="project-card__growth"><strong>성장</strong> {project.growth}</p>

        <section className="project-card__technologies" aria-labelledby={technologyHeadingId}>
          <h4 id={technologyHeadingId}>{variant === 'flagship' ? '핵심 기술' : '기술'}</h4>
          <ul>
            {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
          </ul>
        </section>

        {project.teamTechnologies?.length ? (
          <section className="project-card__team-technologies" aria-labelledby={teamTechnologyHeadingId}>
            <h4 id={teamTechnologyHeadingId}>팀 시스템 연동</h4>
            <ul>
              {project.teamTechnologies.map((technology) => <li key={technology}>{technology}</li>)}
            </ul>
          </section>
        ) : null}

        <a href={project.githubUrl} target="_blank" rel="noreferrer">GitHub에서 보기</a>
      </div>
    </article>
  )
}
