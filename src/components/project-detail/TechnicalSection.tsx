import type { Project } from '../../types/portfolio'

interface TechnicalSectionProps {
  project: Project
}

export function TechnicalSection({ project }: TechnicalSectionProps) {
  const decisions = project.detail?.decisions ?? []

  return (
    <>
      {decisions.length > 0 ? (
        <section className="project-detail__section" aria-labelledby="project-decisions-heading">
          <h2 id="project-decisions-heading">湲곗닠 ?ㅺ퀎? ?먮떒</h2>
          <div className="project-detail__decisions">
            {decisions.map((decision) => (
              <article key={decision.title}>
                <h3>{decision.title}</h3>
                <dl>
                  <div><dt>?곹솴</dt><dd>{decision.situation}</dd></div>
                  <div><dt>?좏깮</dt><dd>{decision.choice}</dd></div>
                  <div><dt>?댁쑀</dt><dd>{decision.reason}</dd></div>
                  <div><dt>援ы쁽</dt><dd>{decision.implementation}</dd></div>
                  {decision.result ? <div><dt>寃곌낵</dt><dd>{decision.result}</dd></div> : null}
                  {decision.reflection ? <div><dt>?뚭퀬</dt><dd>{decision.reflection}</dd></div> : null}
                </dl>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="project-detail__section" aria-labelledby="project-technologies-heading">
        <h2 id="project-technologies-heading">湲곗닠 援ъ꽦</h2>
        <div className="project-detail__technology-groups">
          <section aria-labelledby="project-direct-technologies-heading">
            <h3 id="project-direct-technologies-heading">吏곸젒 ?ъ슜 湲곗닠</h3>
            <ul>{project.technologies.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          {project.teamTechnologies?.length ? (
            <section aria-labelledby="project-team-technologies-heading">
              <h3 id="project-team-technologies-heading">? ?쒖뒪???곕룞</h3>
              <ul>{project.teamTechnologies.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          ) : null}
        </div>
      </section>
    </>
  )
}
