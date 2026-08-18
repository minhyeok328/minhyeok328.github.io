import type { WorkPrinciple } from '../types/portfolio'

interface WorkStyleSectionProps {
  principles: WorkPrinciple[]
}

export function WorkStyleSection({ principles }: WorkStyleSectionProps) {
  return (
    <section id="work" className="site-container portfolio-section work-style-section" aria-labelledby="work-style-heading">
      <h2 id="work-style-heading">How I Work</h2>
      <ul className="work-style-section__principles" aria-label="협업 원칙" role="list">
        {principles.map((principle) => (
          <li key={principle.title}>
            <span className="work-style-section__marker" aria-hidden="true">-</span>
            <div className="work-style-section__principle-content">
              <h3>{principle.title}</h3>
              <p>{principle.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
