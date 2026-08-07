import type { SkillGroup } from '../types/portfolio'

interface SkillsSectionProps {
  skillGroups: SkillGroup[]
}

export function SkillsSection({ skillGroups }: SkillsSectionProps) {
  return (
    <section id="skills" className="site-container portfolio-section skills-section" aria-labelledby="skills-heading">
      <h2 id="skills-heading">Skills</h2>
      <div className="skills-section__groups skills-grid">
        {skillGroups.map((group) => (
          <article key={group.title} className="skills-section__group">
            <h3>{group.title}</h3>
            <section aria-label={`${group.title} 핵심 기술`}>
              <h4>핵심 기술</h4>
              <ul>
                {group.primary.map((skill) => <li key={skill}>{skill}</li>)}
              </ul>
            </section>
            <section aria-label={`${group.title} 경험 기술`}>
              <h4>경험 기술</h4>
              <ul>
                {group.experience.map((skill) => <li key={skill}>{skill}</li>)}
              </ul>
            </section>
          </article>
        ))}
      </div>
    </section>
  )
}
