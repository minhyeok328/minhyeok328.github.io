import type { ExperienceEntry } from '../types/portfolio'

interface ExperienceSectionProps {
  experiences: ExperienceEntry[]
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  if (experiences.length === 0) {
    return null
  }

  return (
    <section id="experience" className="site-container portfolio-section experience-section" aria-labelledby="experience-heading">
      <h2 id="experience-heading">Experience</h2>
      <ol className="experience-section__list">
        {experiences.map((experience) => (
          <li key={experience.id}>
            <article>
              <p>{experience.period}</p>
              <h3>{experience.organization}</h3>
              <p>{experience.title}</p>
              <p>{experience.description}</p>
            </article>
          </li>
        ))}
      </ol>
    </section>
  )
}
