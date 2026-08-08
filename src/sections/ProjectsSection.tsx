import { ProjectCard } from '../components/ProjectCard'
import { scrollToSection } from '../lib/sectionNavigation'
import type { Project } from '../types/portfolio'

interface ProjectsSectionProps {
  flagshipProject: Project
  journeyProjects: Project[]
}

export function ProjectsSection({ flagshipProject, journeyProjects }: ProjectsSectionProps) {
  const projectStages = [...journeyProjects, flagshipProject]

  return (
    <section id="projects" className="site-container portfolio-section projects-section" aria-labelledby="projects-heading">
      <h2 id="projects-heading">Projects</h2>
      <nav className="projects-section__growth-line" aria-label="프로젝트 성장 단계">
        <ol>
          {projectStages.map((project) => (
            <li key={project.id}>
              <button type="button" onClick={() => scrollToSection(project.id)}>
                {project.order}단계 · {project.stage}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <ProjectCard project={flagshipProject} variant="flagship" />

      <section className="projects-section__journey" aria-labelledby="journey-heading">
        <h3 id="journey-heading">Project Journey</h3>
        <div className="projects-section__journey-list journey-grid">
          {journeyProjects.map((project) => <ProjectCard key={project.id} project={project} variant="journey" />)}
        </div>
      </section>
    </section>
  )
}
