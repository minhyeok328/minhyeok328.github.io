import type { Project } from '../../types/portfolio'

interface QuickSummaryProps {
  project: Pick<Project, 'description' | 'growth'>
  roleSummary: string
}

export function QuickSummary({ project, roleSummary }: QuickSummaryProps) {
  return (
    <dl className="project-detail__summary" aria-label="프로젝트 빠른 요약">
      <div><dt>프로젝트</dt><dd>{project.description}</dd></div>
      <div><dt>내 역할</dt><dd>{roleSummary}</dd></div>
      <div><dt>성장</dt><dd>{project.growth}</dd></div>
    </dl>
  )
}
