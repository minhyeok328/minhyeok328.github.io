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
          <h2 id="project-decisions-heading">기술 설계와 판단</h2>
          <div className="project-detail__decisions">
            {decisions.map((decision) => (
              <article key={decision.title}>
                <h3>{decision.title}</h3>
                <dl>
                  <div><dt>상황</dt><dd>{decision.situation}</dd></div>
                  <div><dt>선택</dt><dd>{decision.choice}</dd></div>
                  <div><dt>이유</dt><dd>{decision.reason}</dd></div>
                  <div><dt>구현</dt><dd>{decision.implementation}</dd></div>
                  {decision.result ? <div><dt>결과</dt><dd>{decision.result}</dd></div> : null}
                  {decision.reflection ? <div><dt>회고</dt><dd>{decision.reflection}</dd></div> : null}
                </dl>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="project-detail__section" aria-labelledby="project-technologies-heading">
        <h2 id="project-technologies-heading">기술 구성</h2>
        <div className="project-detail__technology-groups">
          <section aria-labelledby="project-direct-technologies-heading">
            <h3 id="project-direct-technologies-heading">직접 사용 기술</h3>
            <ul>{project.technologies.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          {project.teamTechnologies?.length ? (
            <section aria-labelledby="project-team-technologies-heading">
              <h3 id="project-team-technologies-heading">팀 시스템 연동</h3>
              <ul>{project.teamTechnologies.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          ) : null}
        </div>
      </section>
    </>
  )
}
