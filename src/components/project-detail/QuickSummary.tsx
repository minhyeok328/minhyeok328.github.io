import type { Project } from '../../types/portfolio'

interface QuickSummaryProps {
  project: Pick<Project, 'githubUrl' | 'operatingEnvironment' | 'period'>
  roleSummary: string
}

export function QuickSummary({ project, roleSummary }: QuickSummaryProps) {
  return (
    <dl className="project-detail__summary" role="region" aria-label="프로젝트 핵심 정보">
      <div><dt>진행 기간</dt><dd><time>{project.period}</time></dd></div>
      <div><dt>내 역할</dt><dd>{roleSummary}</dd></div>
      <div>
        <dt>저장소</dt>
        <dd>
          <a href={project.githubUrl} target="_blank" rel="noreferrer">공식 팀 GitHub</a>
        </dd>
      </div>
      {project.operatingEnvironment ? (
        <div><dt>운영 환경</dt><dd>{project.operatingEnvironment}</dd></div>
      ) : null}
    </dl>
  )
}
